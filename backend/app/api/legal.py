from fastapi import APIRouter
import json
from typing import List, Dict, Any
from app.core.config import PROCESSED_DATA_DIR

router = APIRouter(prefix="/legal", tags=["Legal Resources & Helplines"])

@router.get("/sources")
async def get_legal_sources():
    """Retrieve full catalog of verified statutory acts and indexed legal provisions."""
    kb_file = PROCESSED_DATA_DIR / "legal_knowledge_base.json"
    if kb_file.exists():
        with open(kb_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)
            return {"total_provisions": len(chunks), "sources": chunks}
    return {"total_provisions": 0, "sources": []}

@router.get("/categories")
async def get_legal_categories():
    """Retrieve key legal domains supported by NyayaSuno."""
    return {
        "categories": [
            {
                "id": "consumer_rights",
                "title": "Consumer Rights & Defective Services",
                "title_hi": "उपभोक्ता अधिकार और दोषपूर्ण सेवा",
                "description": "Protection against unfair trade practices, fake products, e-commerce fraud, and filing via E-Daakhil without a lawyer.",
                "key_acts": ["Consumer Protection Act, 2019", "Consumer Protection Rules, 2021"],
                "helpline": "1915 (National Consumer Helpline)",
                "official_portal": "https://consumerhelpline.gov.in"
            },
            {
                "id": "rental_tenancy",
                "title": "Rental & Tenancy Issues",
                "title_hi": "किराएदारी और मकान मालिक विवाद",
                "description": "Security deposit refund limits (max 2 months), protection from arbitrary eviction, utility cutoff bans, and Rent Authority procedures.",
                "key_acts": ["Model Tenancy Act, 2021", "State Rent Control Acts"],
                "helpline": "Local Rent Authority / DLSA 15100",
                "official_portal": "https://mohua.gov.in"
            },
            {
                "id": "employment_wages",
                "title": "Employment & Unpaid Wages",
                "title_hi": "रोजगार और बकाया वेतन",
                "description": "Statutory salary payment deadlines (7th/10th of month), unlawful salary withholding, notice period disputes, gratuity, and Labour Court claims.",
                "key_acts": ["Payment of Wages Act, 1936", "Code on Wages, 2019", "Payment of Gratuity Act, 1972"],
                "helpline": "District Labour Commissioner / SAMADHAN Portal",
                "official_portal": "https://labour.gov.in"
            },
            {
                "id": "legal_aid_procedures",
                "title": "Free Legal Aid & Court Procedures",
                "title_hi": "मुफ्त कानूनी सहायता और प्रक्रिया",
                "description": "Section 12 NALSA eligibility for free advocates (women, children, workers, low income), responding to legal notices, and Lok Adalats.",
                "key_acts": ["Legal Services Authorities Act, 1987", "Indian Contract Act, 1872", "Limitation Act, 1963"],
                "helpline": "15100 (National Legal Aid Helpline)",
                "official_portal": "https://nalsa.gov.in"
            }
        ]
    }

@router.get("/helplines")
async def get_emergency_helplines():
    """Official Indian government legal and consumer grievance helplines."""
    return {
        "helplines": [
            {
                "name": "National Legal Aid Helpline (NALSA)",
                "number": "15100",
                "hours": "24 Hours x 7 Days (Toll-Free)",
                "description": "Free legal aid, counsel assignment, and dispute guidance by National Legal Services Authority.",
                "website": "https://nalsa.gov.in",
                "category": "Legal Aid"
            },
            {
                "name": "National Consumer Helpline (NCH)",
                "number": "1915",
                "hours": "8:00 AM – 8:00 PM (All days except National Holidays)",
                "description": "Consumer complaint registration, company grievance escalation, and e-commerce redressal.",
                "website": "https://consumerhelpline.gov.in",
                "category": "Consumer"
            },
            {
                "name": "National Cyber Crime Reporting Helpline",
                "number": "1930",
                "hours": "24x7 Emergency",
                "description": "Report financial cyber fraud, phishing, unauthorized bank transactions, and online scams.",
                "website": "https://cybercrime.gov.in",
                "category": "Cyber Fraud"
            },
            {
                "name": "Women's Helpline (National Commission for Women)",
                "number": "1091 / 7827170170",
                "hours": "24 Hours Toll-Free",
                "description": "Emergency legal, psychological and protective support for women.",
                "website": "http://ncw.nic.in",
                "category": "Women Rights"
            }
        ]
    }

