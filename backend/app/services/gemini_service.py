import json
import re
import os
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.models.schemas import LegalAnswerStructured, LegalSourceCitation

# Prevent SSL keylogger file permission errors on Windows
os.environ.pop("SSLKEYLOGFILE", None)

SYSTEM_PROMPT = """You are NyayaSuno, an empathetic, highly knowledgeable, and reliable AI Legal Information Assistant for India.
Your mission is to make Indian legal information understandable and accessible to ordinary citizens in simple Hindi, English, or conversational Hinglish.

CRITICAL RULES:
1. INFORMATIONAL ASSISTANT ONLY: You are not a lawyer. Never claim to give definitive legal outcomes or replace a professional advocate.
2. CITATIONS: Use ONLY the provided verified legal context. Never fabricate acts, sections, or court decisions.
3. INSUFFICIENT CONTEXT: If the retrieved sources do not cover the user's issue, state clearly that the verified legal base has insufficient information and recommend seeking legal counsel or contacting NALSA Helpline 15100.
4. STRUCTURE: You MUST return a strictly valid JSON object matching the exact structure requested below.
5. LANGUAGE: Respond in the user's chosen language (Hindi, English, or conversational Hinglish). If Hindi is selected, use warm, clear, simple language avoiding archaic jargon.

OUTPUT JSON SCHEMA:
{
  "understanding": "Clear summary of user's situation and problem",
  "relevant_laws": [
    {"act": "Name of Act", "section": "Section number", "provision_title": "Title"}
  ],
  "simple_explanation": "Plain language explanation of how the law applies in their situation without confusing jargon",
  "possible_next_steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ],
  "documents_needed": [
    "Document 1...",
    "Document 2..."
  ],
  "disclaimer": "This information is for educational and guidance purposes only under Indian law and does not constitute formal legal representation or binding legal advice. State laws may vary. For personalized representation, consult a licensed advocate or contact NALSA at 15100.",
  "missing_information": ["Any vital facts missing from the user's query"],
  "suggested_questions": ["Follow-up question 1", "Follow-up question 2"]
}
"""

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.models_to_try = [
            settings.GEMINI_MODEL,
            "gemini-2.0-flash",
            "gemini-3.1-flash-lite",
            "gemini-3-flash-preview",
            "gemini-flash-latest"
        ]
        self.groq_api_key = settings.GROQ_API_KEY

    async def generate_legal_answer(
        self,
        query: str,
        citations: List[LegalSourceCitation],
        context_text: str,
        is_insufficient: bool,
        language: str = "en",
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> LegalAnswerStructured:
        """Generate structured legal response using Gemini REST API or Groq with RAG grounding."""
        os.environ.pop("SSLKEYLOGFILE", None)

        history_prompt = ""
        if conversation_history:
            history_prompt = "CONVERSATION HISTORY:\n" + "\n".join(
                f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
                for m in conversation_history[-4:]
            ) + "\n\n"

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"{history_prompt}"
            f"USER QUERY: {query}\n"
            f"REQUESTED LANGUAGE: {language}\n"
            f"INSUFFICIENT CONTEXT FLAG: {is_insufficient}\n\n"
            f"VERIFIED STATUTORY CONTEXT FROM RAG:\n{context_text}\n\n"
            f"Synthesize the legal answer in JSON format adhering strictly to the schema."
        )

        # 1. Try Google Gemini with modern models
        if self.api_key:
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }

            gemini_headers = {
                "x-goog-api-key": self.api_key.strip(),
                "Content-Type": "application/json"
            }

            for model_name in self.models_to_try:
                try:
                    # Support both standard header (required for new AQ. Auth keys) and URL query
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key.strip()}"
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        resp = await client.post(url, headers=gemini_headers, json=payload)
                        if resp.status_code == 200:
                            res_json = resp.json()
                            candidates = res_json.get("candidates", [])
                            if candidates:
                                raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                                # Clean markdown JSON wrappers if present
                                raw_text = re.sub(r"^```json\s*", "", raw_text)
                                raw_text = re.sub(r"\s*```$", "", raw_text)
                                parsed = json.loads(raw_text)
                                print(f" Gemini API responded successfully with model '{model_name}'.")
                                return LegalAnswerStructured(
                                    understanding=parsed.get("understanding", "We analyzed your situation."),
                                    relevant_laws=parsed.get("relevant_laws", []),
                                    simple_explanation=parsed.get("simple_explanation", ""),
                                    possible_next_steps=parsed.get("possible_next_steps", []),
                                    documents_needed=parsed.get("documents_needed", []),
                                    sources=citations,
                                    disclaimer=parsed.get("disclaimer", "NyayaSuno provides legal information, not formal legal representation. Contact NALSA at 15100 or a qualified advocate."),
                                    missing_information=parsed.get("missing_information", []),
                                    is_insufficient_context=is_insufficient,
                                    suggested_questions=parsed.get("suggested_questions", [])
                                )
                        else:
                            err_msg = resp.text[:200]
                            print(f" Gemini API {model_name} returned HTTP {resp.status_code}: {err_msg}")
                            # If API key itself is reported invalid, don't loop through all models
                            if "API_KEY_INVALID" in err_msg or "INVALID_ARGUMENT" in err_msg:
                                print(" Gemini API key appears invalid or malformed. Falling back to Groq / Grounded engine.")
                                break
                except Exception as e:
                    print(f"Gemini API attempt with {model_name} failed: {e}. Trying next...")

        # 2. Try Groq LLM as secondary AI redundancy if Gemini is unavailable
        if self.groq_api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json"
                }
                groq_payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=groq_payload)
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        print(" Groq LLM fallback responded successfully.")
                        return LegalAnswerStructured(
                            understanding=parsed.get("understanding", "We analyzed your situation."),
                            relevant_laws=parsed.get("relevant_laws", []),
                            simple_explanation=parsed.get("simple_explanation", ""),
                            possible_next_steps=parsed.get("possible_next_steps", []),
                            documents_needed=parsed.get("documents_needed", []),
                            sources=citations,
                            disclaimer=parsed.get("disclaimer", "NyayaSuno provides legal information, not formal representation."),
                            missing_information=parsed.get("missing_information", []),
                            is_insufficient_context=is_insufficient,
                            suggested_questions=parsed.get("suggested_questions", [])
                        )
            except Exception as e:
                print(f"Groq LLM fallback failed: {e}")

        # 3. Resilient Grounded Rule Engine
        print(" Using verified Grounded Statutory Rule Engine.")
        return self._generate_grounded_fallback(query, citations, is_insufficient, language)

    def _generate_grounded_fallback(
        self,
        query: str,
        citations: List[LegalSourceCitation],
        is_insufficient: bool,
        language: str
    ) -> LegalAnswerStructured:
        """Grounded answer synthesized from indexed legal provisions."""
        is_hindi = language in ("hi", "hinglish") or any(
            w in query.lower() for w in ["kya", "mera", "meri", "hai", "nahi", "kar", "sakta", "vetan", "kiraya", "makan", "vakeel"]
        )

        relevant_laws = []
        for cit in citations:
            relevant_laws.append({
                "act": cit.act_name,
                "section": cit.section,
                "provision_title": cit.heading
            })

        top_act = citations[0].act_name if citations else "Indian Statutory Framework"

        if "Rental" in top_act or "Tenancy" in top_act or "kiraya" in query.lower() or "deposit" in query.lower():
            if is_hindi:
                understanding = "आप अपने मकान मालिक द्वारा सुरक्षा जमा (Security Deposit) वापस न किए जाने या किराएदारी विवाद से परेशान हैं।"
                simple_explanation = (
                    "मॉडल टेनेंसी एक्ट (Model Tenancy Act) और राज्य किराया नियंत्रण कानूनों के तहत, आवासीय परिसर के लिए सुरक्षा जमा आम तौर पर 2 महीने के किराए से अधिक नहीं हो सकता। "
                    "मकान खाली करने पर मकान मालिक को बकाया किराया और वास्तविक बिजली/पानी बिल काटकर शेष पूरी जमा राशि वापस करनी होती है। "
                    "बिना किसी वैध कारण के पूरी जमा राशि रोकना गैरकानूनी है।"
                )
                steps = [
                    "मकान मालिक को लिखित डिमांड लेटर या ईमेल भेजें जिसमें जमा राशि का हिसाब और 15 दिनों में भुगतान का अनुरोध हो।",
                    "यदि राशि नहीं मिलती, तो पंजीकृत डाक (RPAD) से औपचारिक लीगल नोटिस भेजें।",
                    "स्थानीय रेंट अथॉरिटी / रेंट कोर्ट (Rent Authority/Court) में आवेदन प्रस्तुत करें।",
                    "यदि पीजी या कमर्शियल सह-आवास कंपनी है, तो उपभोक्ता फोरम (E-Daakhil पोर्टल) पर भी शिकायत कर सकते हैं।"
                ]
                docs = [
                    "हस्ताक्षरित रेंट एग्रीमेंट (Rent Agreement)",
                    "सिक्योरिटी डिपॉजिट के बैंक ट्रांसफर या रसीद का प्रमाण",
                    "मकान खाली करने का नोटिस और चाबी सौंपने की तारीख का प्रमाण (WhatsApp/Email)",
                    "बिजली और पानी के अद्यतन भुगतान किए गए बिल"
                ]
                disclaimer = "यह जानकारी भारतीय किराएदारी कानूनों पर आधारित सामान्य कानूनी जानकारी है। राज्य के अनुसार नियम भिन्न हो सकते हैं। विशिष्ट मामले के लिए वकील से परामर्श लें।"
                suggested_q = [
                    "क्या रेंट एग्रीमेंट में नोटिस पीरियड की कोई विशेष शर्त थी?",
                    "क्या मकान मालिक ने कटौतियों की कोई लिखित सूची दी है?",
                    "रेंट अथॉरिटी में शिकायत कैसे दर्ज करें?"
                ]
            else:
                understanding = "You are facing an issue where your landlord has withheld or refused to refund your rental security deposit."
                simple_explanation = (
                    "Under the Model Tenancy Act guidelines and State Rent Control legislation, a security deposit for residential premises is typically capped at two months' rent. "
                    "Upon handing over vacant possession, the landlord is legally obligated to refund the deposit after deducting legitimate arrears of rent or verified utility bills. "
                    "Arbitrary or unilateral forfeiture without documented damage is unlawful."
                )
                steps = [
                    "Issue a formal written Demand Letter or Email detailing the tenancy end date and requesting refund within 15 days.",
                    "If the landlord fails to comply, send a formal Legal Notice through registered post or an advocate.",
                    "File a petition before the Rent Authority / Rent Court under the applicable State Tenancy Act.",
                    "For commercial co-living spaces or student accommodations, you can also approach the Consumer Forum via E-Daakhil."
                ]
                docs = [
                    "Original signed Tenancy / Lease Agreement",
                    "Proof of security deposit payment (Bank statement or receipt)",
                    "Written move-out notice and key handover acknowledgment",
                    "Electricity / water clearance receipts"
                ]
                disclaimer = "This information is for general educational guidance only under Indian law. State tenancy laws differ. Consult an advocate for legal representation."
                suggested_q = [
                    "Did your agreement include a mandatory lock-in period?",
                    "Has the landlord provided an itemized list of deductions?",
                    "How do I file a petition before the local Rent Authority?"
                ]

        elif "Wages" in top_act or "Salary" in top_act or "vetan" in query.lower() or "salary" in query.lower() or "employer" in query.lower():
            if is_hindi:
                understanding = "आपकी कंपनी या नियोक्ता ने आपका वेतन (Salary) रोक रखा है या भुगतान में देरी कर रहा है।"
                simple_explanation = (
                    "पेमेंट ऑफ वेजेज एक्ट (Payment of Wages Act, 1936) और वेज कोड 2019 के अनुसार, प्रत्येक कर्मचारी को उसका वेतन तय समय (7 या 10 तारीख) के भीतर मिलना अनिवार्य है। "
                    "रोजगार समाप्त होने पर बकाया राशि 2 कार्य दिवसों में दी जानी चाहिए। मनमाने तरीके से अर्जित वेतन काटना गैरकानूनी है।"
                )
                steps = [
                    "कंपनी के एचआर और प्रबंधन को लिखित मांग ईमेल (Demand Email) भेजें जिसमें बकाया महीनों का विवरण हो।",
                    "7-15 दिनों में भुगतान न होने पर औपचारिक लीगल नोटिस जारी करें।",
                    "जिला श्रम आयुक्त (Labour Commissioner / ALC) के समक्ष सुलह के लिए शिकायत दर्ज करें।",
                    "श्रम न्यायालय (Labour Court) में धारा 15 या औद्योगिक विवाद अधिनियम की धारा 33C(2) के तहत दावा दायर करें।"
                ]
                docs = [
                    "ऑफर लेटर / रोजगार अनुबंध (Offer Letter / Employment Contract)",
                    "पिछले वेतन पर्चियां (Salary Slips)",
                    "बैंक स्टेटमेंट जिसमें वेतन क्रेडिट का रिकॉर्ड हो",
                    "इस्तीफा पत्र या निष्कासन पत्र (Resignation or Termination email)"
                ]
                disclaimer = "यह जानकारी कानूनी अधिकारों की व्याख्या है, कानूनी सलाह नहीं। आर्थिक रूप से कमजोर श्रमिक NALSA हेल्पलाइन 15100 पर मुफ्त वकील प्राप्त कर सकते हैं।"
                suggested_q = [
                    "क्या आपने इस्तीफा दे दिया है या कंपनी ने निकाला है?",
                    "क्या आपके पास उपस्थिति (Attendance) का रिकॉर्ड है?",
                    "लेबर कोर्ट में रिकवरी का क्या तरीका है?"
                ]
            else:
                understanding = "Your employer has withheld or delayed payment of earned salary or final settlement dues."
                simple_explanation = (
                    "Under the Payment of Wages Act, 1936 and Code on Wages, employers must disburse wages within 7 to 10 days of the wage period. "
                    "Upon termination or resignation, earned dues must be settled promptly. Arbitrary deductions without statutory justification are strictly prohibited."
                )
                steps = [
                    "Send a formal Demand Email to the employer and HR listing the exact unpaid amounts and bank details.",
                    "If unpaid within 15 days, serve a formal Legal Notice demanding release of salary with interest.",
                    "File a formal complaint before the District Labour Officer / Assistant Labour Commissioner (ALC).",
                    "Initiate recovery proceedings under Section 15 of Payment of Wages Act or Section 33C(2) of Industrial Disputes Act."
                ]
                docs = [
                    "Appointment letter or Employment Contract",
                    "Salary slips and Form 16 / Bank statements",
                    "Email trails regarding resignation or release",
                    "Attendance or project log records"
                ]
                disclaimer = "This information is intended for educational purposes under Indian labour laws. Consult an advocate or trade union representative for litigation."
                suggested_q = [
                    "Did you complete the stipulated notice period?",
                    "Do you have written confirmation of your relieving date?",
                    "Are you eligible for gratuity (completed 5 years)?"
                ]

        elif "Consumer" in top_act or "grahak" in query.lower() or "defective" in query.lower() or "refund" in query.lower():
            if is_hindi:
                understanding = "आप किसी खरीदे गए उत्पाद के खराब होने, दोषपूर्ण सेवा या कंपनी द्वारा धोखाधड़ी से पीड़ित उपभोक्ता हैं।"
                simple_explanation = (
                    "उपभोक्ता संरक्षण अधिनियम 2019 (Consumer Protection Act) के तहत उपभोक्ताओं को दोषपूर्ण सामान और सेवाओं में कमी (Deficiency in Service) के खिलाफ निवारण पाने का अधिकार है। "
                    "ई-दाखिल (edaakhil.nic.in) पोर्टल के माध्यम से आप घर बैठे बिना किसी वकील के उपभोक्ता फोरम में शिकायत दर्ज करा सकते हैं।"
                )
                steps = [
                    "राष्ट्रीय उपभोक्ता हेल्पलाइन (NCH) 1915 पर कॉल करें या consumerhelpline.gov.in पर शिकायत दर्ज करें।",
                    "कंपनी के कस्टमर केयर और नोडल ऑफिसर को लिखित नोटिस भेजकर समाधान का 15 दिन का समय दें।",
                    "यदि समाधान नहीं होता, तो जिला उपभोक्ता विवाद निवारण आयोग में E-Daakhil पोर्टल पर वाद दायर करें।"
                ]
                docs = [
                    "खरीद बिल या टैक्स इनवॉइस (Tax Invoice)",
                    "वारंटी / गारंटी कार्ड",
                    "कस्टमर केयर की शिकायत टिकट संख्या और ईमेल",
                    "उत्पाद के दोष की तस्वीरें या तकनीकी रिपोर्ट"
                ]
                disclaimer = "उपभोक्ता कानून के तहत सामान्य सूचना। 50 लाख रुपये तक के दावों के लिए जिला उपभोक्ता आयोग अधिकृत है।"
                suggested_q = [
                    "क्या आपने उत्पाद वारंटी अवधि के भीतर शिकायत की है?",
                    "क्या आपके पास खरीद का पक्का बिल (Invoice) मौजूद है?",
                    "ई-दाखिल पोर्टल पर अकाउंट कैसे बनाएं?"
                ]
            else:
                understanding = "You have experienced deficiency in service, a defective product, or unfair trade practice from a seller or service provider."
                simple_explanation = (
                    "Under the Consumer Protection Act, 2019, consumers have the statutory right to seek redressal, refund, or compensation for defective goods and deficiency in service. "
                    "The law enables individuals to file complaints directly through the E-Daakhil portal (edaakhil.nic.in) without needing a legal advocate."
                )
                steps = [
                    "Register a pre-litigation complaint with the National Consumer Helpline (NCH) at 1915 or consumerhelpline.gov.in.",
                    "Send a formal written grievance to the merchant's Grievance Officer allowing 15 days for resolution.",
                    "File an online complaint before the District Consumer Disputes Redressal Commission via E-Daakhil."
                ]
                docs = [
                    "Original Invoice / Cash Memo / Order receipt",
                    "Warranty card or terms of service",
                    "Customer support chat transcripts or email records",
                    "Photographs or videos demonstrating product defect"
                ]
                disclaimer = "General legal information under CPA 2019. District Commission hears claims up to Rs 50 Lakhs. Consult a legal professional for complex claims."
                suggested_q = [
                    "Have you lodged a ticket with the National Consumer Helpline (1915)?",
                    "Was the product purchased online or offline?",
                    "What is the total monetary consideration paid?"
                ]

        else:
            if is_hindi:
                understanding = "आपकी कानूनी स्थिति का विश्लेषण भारतीय कानूनों और विधिक सेवा प्राधिकरण (NALSA) के दिशा-निर्देशों के अनुसार किया गया है।"
                simple_explanation = (
                    "विधिक सेवा प्राधिकरण अधिनियम, 1987 (Legal Services Authorities Act) के तहत महिलाओं, बच्चों, श्रमिकों और कम आय वाले नागरिकों को मुफ्त कानूनी सहायता और सरकारी वकील की सुविधा प्रदान की जाती है। "
                    "इसके अलावा किसी भी दीवानी विवाद में कोर्ट जाने से पहले औपचारिक लीगल नोटिस भेजना एक स्थापित कानूनी प्रक्रिया है।"
                )
                steps = [
                    "राष्ट्रीय विधिक सहायता हेल्पलाइन नंबर 15100 (Toll-Free, 24x7) पर कॉल करके निःशुल्क कानूनी सलाह प्राप्त करें।",
                    "संबंधित पार्टी को स्थिति स्पष्ट करते हुए एक औपचारिक पत्र या लीगल नोटिस भेजें।",
                    "निकटतम जिला विधिक सेवा प्राधिकरण (DLSA) कार्यालय में जाकर मुफ्त वकील के लिए आवेदन करें।"
                ]
                docs = [
                    "विवाद से संबंधित सभी लिखित समझौते या कागजात",
                    "पहचान प्रमाण पत्र (आधार कार्ड / वोटर आईडी)",
                    "आय प्रमाण पत्र (यदि मुफ्त कानूनी सहायता के लिए आवेदन कर रहे हैं)"
                ]
                disclaimer = "न्यायसुनो एक सूचनात्मक सहायक है। NALSA हेल्पलाइन 15100 पर संपर्क करें या अधिकृत वकील से सहायता लें।"
                suggested_q = [
                    "क्या आप NALSA की मुफ्त कानूनी सहायता के पात्र हैं?",
                    "क्या आपके पास मामले से जुड़े मूल दस्तावेज़ उपलब्ध हैं?"
                ]
            else:
                understanding = "Your inquiry involves civil procedures, contractual rights, or access to free legal services under Indian law."
                simple_explanation = (
                    "Under the Legal Services Authorities Act, 1987, eligible citizens (including women, children, industrial workers, and individuals below state income thresholds) are entitled to free legal aid through NALSA. "
                    "For civil disputes, sending a formal written Demand or Legal Notice giving 15 to 30 days is the standard preliminary procedure before initiating litigation."
                )
                steps = [
                    "Call the National Legal Aid Helpline 15100 (Toll-Free, 24x7) for immediate confidential counseling.",
                    "Draft and send a formal Notice of Demand detailing your claims and supporting evidence.",
                    "Visit your District Legal Services Authority (DLSA) at the District Court complex to apply for an assigned advocate if eligible."
                ]
                docs = [
                    "Relevant written contracts, agreements, or correspondence",
                    "Government-issued identity proof (Aadhaar / Voter ID)",
                    "Income certificate (for NALSA free legal aid eligibility)"
                ]
                disclaimer = "NyayaSuno provides legal information only. For formal representation, contact NALSA at 15100 or consult an advocate."
                suggested_q = [
                    "Are you eligible for free legal aid under Section 12 of NALSA Act?",
                    "Do you have written proof of the agreement or transaction?"
                ]

        return LegalAnswerStructured(
            understanding=understanding,
            relevant_laws=relevant_laws,
            simple_explanation=simple_explanation,
            possible_next_steps=steps,
            documents_needed=docs,
            sources=citations,
            disclaimer=disclaimer,
            missing_information=["Specific dates and written contracts"],
            is_insufficient_context=is_insufficient,
            suggested_questions=suggested_q
        )

gemini_service = GeminiService()
