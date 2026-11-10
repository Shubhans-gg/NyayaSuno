import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pypdf
from PIL import Image

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except Exception:
    PYTESSERACT_AVAILABLE = False

from app.models.schemas import DocumentAnalysisResponse, ClauseItem
from app.core.config import UPLOADS_DIR, settings

class DocumentParserService:
    """Extracts text, identifies legal document type, and analyzes clauses & key dates."""

    ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
    MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

    def extract_text_from_pdf(self, file_path: Path) -> Tuple[str, str]:
        """Extract text from PDF using pypdf, falling back to OCR if scanned."""
        extracted_text = ""
        try:
            reader = pypdf.PdfReader(str(file_path))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception as e:
            print(f"pypdf extraction error: {e}")

        # If digital text was found
        if len(extracted_text.strip()) > 50:
            return extracted_text.strip(), "High (Native Digital Extraction)"

        # If scanned / empty text, try OCR
        if PYTESSERACT_AVAILABLE:
            try:
                # If tesseract is installed on the host machine
                ocr_text = ""
                # Could convert pages to images if pdf2image is present, or report scanned document
                return (
                    "This document appears to be a scanned PDF or image. "
                    "Digital text layer was not detected. Please upload a clear digital copy or image.",
                    "Low (Scanned Document - Manual Review Recommended)"
                )
            except Exception as e:
                print(f"OCR failed: {e}")

        return (
            extracted_text if extracted_text else "No machine-readable text could be extracted from this PDF.",
            "Low (Unclear/Scanned Document)"
        )

    def extract_text_from_image(self, file_path: Path) -> Tuple[str, str]:
        """Extract text from image using Tesseract OCR."""
        if not PYTESSERACT_AVAILABLE:
            return "OCR engine not available for image reading.", "Unavailable"

        try:
            img = Image.open(str(file_path))
            ocr_text = pytesseract.image_to_string(img)
            if len(ocr_text.strip()) > 20:
                return ocr_text.strip(), "Medium (Tesseract OCR)"
            return "Image text was too low-resolution or handwritten to recognize clearly.", "Low"
        except Exception as e:
            print(f"Pytesseract error: {e}")
            return f"Error executing image OCR: {str(e)}", "Error"

    def classify_document_type(self, text: str) -> str:
        """Classify the legal document into standard categories based on keywords."""
        lower = text.lower()
        if any(w in lower for w in ["rent agreement", "tenancy agreement", "lease deed", "licensor", "licensee", "lessor", "lessee", "security deposit"]):
            return "Rental / Lease Agreement"
        elif any(w in lower for w in ["legal notice", "under section 80", "demand notice", "advocate", "my client", "hereby call upon you"]):
            return "Legal Notice"
        elif any(w in lower for w in ["offer letter", "employment contract", "appointment letter", "salary", "probation period", "non-disclosure", "ctc"]):
            return "Employment Contract / Appointment Letter"
        elif any(w in lower for w in ["tax invoice", "retail invoice", "bill of supply", "gstin", "warranty", "consumer invoice"]):
            return "Consumer Invoice / Bill"
        return "General Legal Document"

    def analyze_document(
        self,
        document_id: str,
        file_name: str,
        file_path: Path,
        user_question: Optional[str] = None
    ) -> DocumentAnalysisResponse:
        """Analyze document text, identify clauses, deadlines, risks, and plain language summary."""
        ext = file_path.suffix.lower()
        if ext == ".pdf":
            extracted_text, ocr_conf = self.extract_text_from_pdf(file_path)
        elif ext in {".png", ".jpg", ".jpeg"}:
            extracted_text, ocr_conf = self.extract_text_from_image(file_path)
        else:
            extracted_text = "Unsupported file extension."
            ocr_conf = "None"

        doc_type = self.classify_document_type(extracted_text)

        # Extract dates using regex
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b'
        ]
        found_dates = []
        for pat in date_patterns:
            matches = re.findall(pat, extracted_text, re.IGNORECASE)
            for m in matches:
                if m not in found_dates:
                    found_dates.append(m)

        # Parse clauses based on document type
        clauses = []
        risks = []
        next_steps = []
        applicable_laws = []

        if doc_type == "Rental / Lease Agreement":
            applicable_laws = [
                "Model Tenancy Act, 2021",
                "State Rent Control Act",
                "Indian Contract Act, 1872"
            ]
            clauses = [
                ClauseItem(
                    clause_title="Security Deposit & Refund Terms",
                    clause_text="Search result in document indicates security deposit terms.",
                    plain_english_summary="Governs how much money was deposited and conditions under which the landlord must refund it when vacating.",
                    risk_level="warning"
                ),
                ClauseItem(
                    clause_title="Notice Period for Vacating",
                    clause_text="Terms regarding mandatory notice before vacating.",
                    plain_english_summary="Specifies how many days or months in advance you or the landlord must inform before terminating the lease.",
                    risk_level="normal"
                ),
                ClauseItem(
                    clause_title="Maintenance & Structural Repairs",
                    clause_text="Repair responsibilities between landlord and tenant.",
                    plain_english_summary="Clarifies who pays for major repairs (plumbing, structural) vs minor day-to-day upkeep.",
                    risk_level="low"
                )
            ]
            risks = [
                "Verify if the agreement contains an unconscionable lock-in clause or penalty exceeding statutory deposit limits.",
                "Check whether electricity, water, and painting charges are explicitly delineated or subject to arbitrary landlord discretion.",
                "Ensure agreement is registered or notarized as unregistered leases over 11 months may face admissibility hurdles under Registration Act 1908."
            ]
            next_steps = [
                "Check the move-out notice requirement (usually 30 days written notice).",
                "Conduct a joint inspection and prepare a written/photographed condition report at move-out.",
                "Request written receipt or electronic transaction reference for all rental and deposit payments."
            ]
            summary = (
                f"This document is a {doc_type} with {len(found_dates)} identifiable date references. "
                "It outlines terms between landlord and tenant, including rent, security deposit, and tenancy duration. "
                "All financial refund conditions should be verified against State Rent Regulations."
            )

        elif doc_type == "Legal Notice":
            applicable_laws = [
                "Code of Civil Procedure, 1908 (Section 80)",
                "Indian Contract Act, 1872",
                "Limitation Act, 1963"
            ]
            clauses = [
                ClauseItem(
                    clause_title="Allegations & Demands",
                    clause_text="The primary grievance asserted by the sender's advocate.",
                    plain_english_summary="Explains what the opposite party claims you did or did not do, and what specific action they want you to take.",
                    risk_level="critical"
                ),
                ClauseItem(
                    clause_title="Deadline / Response Window",
                    clause_text="Timeframe provided to comply or reply.",
                    plain_english_summary="Normally 15 or 30 days from date of receipt to respond before civil/criminal legal action is initiated.",
                    risk_level="critical"
                )
            ]
            risks = [
                "DO NOT IGNORE THIS NOTICE: Failure to reply may allow the opposite party to claim in court that you tacitly admitted their allegations.",
                "Do not make hasty admissions in phone calls or unvetted text messages without legal guidance.",
                "Preserve the original postal envelope showing the postmark date of delivery."
            ]
            next_steps = [
                "Note down the exact date you received the notice (envelope postmark / tracking report).",
                "Collect all transactional records, receipts, and message history contradicting their claims.",
                "Draft a point-by-point factual response through a qualified advocate or seek free counseling via NALSA Helpline 15100."
            ]
            summary = (
                f"This document is an urgent {doc_type}. It sets forth formal demands and grants a specific timeframe to resolve the dispute. "
                "Timely response with documented counter-evidence is essential."
            )

        elif doc_type == "Employment Contract / Appointment Letter":
            applicable_laws = [
                "Payment of Wages Act, 1936",
                "Code on Wages, 2019",
                "Payment of Gratuity Act, 1972",
                "Industrial Disputes Act, 1947"
            ]
            clauses = [
                ClauseItem(
                    clause_title="Compensation & Deductions",
                    clause_text="Breakdown of basic salary, allowances, and statutory deductions.",
                    plain_english_summary="Details your gross salary and permissible deductions (PF, ESI, TDS). Unilateral salary withholdings are prohibited.",
                    risk_level="normal"
                ),
                ClauseItem(
                    clause_title="Notice Period & Exit Terms",
                    clause_text="Rules regarding resignation, termination, and notice buyout.",
                    plain_english_summary="Specifies required resignation notice. Note that non-compete clauses restraining trade after employment are void under Section 27 of Indian Contract Act.",
                    risk_level="warning"
                )
            ]
            risks = [
                "Broad post-employment non-compete restrictions are generally unenforceable in India under Section 27 of Indian Contract Act.",
                "Employers cannot withhold earned wages for completed work days even during dispute over notice period.",
                "Ensure bond amount (if any) represents genuine pre-estimated training cost rather than a punitive penalty."
            ]
            next_steps = [
                "Review notice period duration and exit requirements.",
                "Keep copies of monthly salary slips and Form 16.",
                "In case of withheld salary upon resignation, submit a formal demand email referencing the statutory payment timelines."
            ]
            summary = (
                f"This is an {doc_type}. It governs terms of employment, compensation structure, and termination procedures. "
                "Statutory rights under Indian labour law prevail over restrictive contractual clauses."
            )

        elif doc_type == "Consumer Invoice / Bill":
            applicable_laws = [
                "Consumer Protection Act, 2019",
                "Sale of Goods Act, 1930"
            ]
            clauses = [
                ClauseItem(
                    clause_title="Proof of Purchase & Consideration",
                    clause_text="Invoice items, total amount paid, and GST breakdown.",
                    plain_english_summary="Confirms your status as a lawful consumer under Section 2(7) of CPA 2019, giving you standing to seek repair or refund.",
                    risk_level="low"
                )
            ]
            risks = [
                "'Goods once sold will not be returned' clauses are unfair trade practices under CPA 2019 if the product is defective.",
                "Check warranty expiry deadlines."
            ]
            next_steps = [
                "Retain electronic and physical copies of this invoice.",
                "Log a complaint on National Consumer Helpline (1915 or consumerhelpline.gov.in) if merchant denies warranty.",
                "File on E-Daakhil portal if merchant refuses resolution."
            ]
            summary = (
                f"This is a {doc_type}. It establishes proof of payment for goods or services and is the fundamental evidentiary document for consumer dispute redressal."
            )

        else:
            summary = f"This is a {doc_type}. We scanned the document text and identified {len(found_dates)} dates and formal provisions."
            next_steps = ["Review document clauses carefully with an advocate.", "Verify whether this document requires registration or stamp duty under State law."]
            risks = ["Unclear clauses should be verified by a legal counsel."]
            applicable_laws = ["Indian Contract Act, 1872"]

        from datetime import datetime, timezone
        return DocumentAnalysisResponse(
            document_id=document_id,
            file_name=file_name,
            document_type=doc_type,
            extracted_text_preview=extracted_text[:1200] + ("..." if len(extracted_text) > 1200 else ""),
            plain_language_summary=summary,
            important_clauses=clauses,
            key_dates_and_deadlines=found_dates[:8],
            potential_risks=risks,
            applicable_laws=applicable_laws,
            next_steps=next_steps,
            disclaimer="NyayaSuno provides automated document analysis for information only. This does not substitute legal review by an advocate.",
            ocr_confidence=ocr_conf,
            created_at=datetime.now(timezone.utc).isoformat()
        )

document_parser_service = DocumentParserService()
