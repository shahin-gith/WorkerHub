import { CompanyReview, HelpArticle } from '../types';

export interface OfflineCompanyEntry {
  name: string;
  industry: 'Construction' | 'Marine Shipyard' | 'Manufacturing' | 'Process' | 'Services' | 'Other';
  address: string;
  description: string;
}

export const OFFLINE_SINGAPORE_COMPANIES: OfflineCompanyEntry[] = [
  {
    name: 'Seatrium Limited (Tuas Yard)',
    industry: 'Marine Shipyard',
    address: '80 Tuas South Boulevard, Singapore 637051',
    description: 'Major offshore, marine engineering, and ship repair yard in Tuas South.',
  },
  {
    name: 'Keppel Offshore & Marine Pte Ltd',
    industry: 'Marine Shipyard',
    address: '50 Gul Road, Singapore 629351',
    description: 'Shipbuilding, rig repair, and offshore engineering specialist in Gul / Pioneer.',
  },
  {
    name: 'ST Engineering Marine Ltd',
    industry: 'Marine Shipyard',
    address: '7 Benoi Road, Singapore 629882',
    description: 'Shipbuilding, ship conversion, and marine maintenance engineering in Benoi.',
  },
  {
    name: 'Woh Hup (Private) Limited',
    industry: 'Construction',
    address: '1 Fifth Avenue, Guthrie House, Singapore 268802',
    description: 'Large civil engineering, building construction, and MRT infrastructure contractor.',
  },
  {
    name: 'Kimly Construction Pte Ltd',
    industry: 'Construction',
    address: '30 Lorong 15 Geylang, Singapore 388617',
    description: 'General building, civil engineering, and HDB residential construction builder.',
  },
  {
    name: 'Lian Beng Construction (1988) Pte Ltd',
    industry: 'Construction',
    address: '29 Harrison Road, Singapore 369648',
    description: 'Commercial, industrial, and residential high-rise building contractor.',
  },
  {
    name: 'Tiong Seng Contractors (Pte) Ltd',
    industry: 'Construction',
    address: '21 Fan Yoong Road, Singapore 629796',
    description: 'Civil infrastructure, precast concrete, and general construction group.',
  },
  {
    name: 'Hexacon Construction Pte Ltd',
    industry: 'Construction',
    address: '432 Balestier Road, Singapore 329813',
    description: 'Commercial buildings, schools, and civil works construction contractor.',
  },
  {
    name: 'Lum Chang Building Contractors Pte Ltd',
    industry: 'Construction',
    address: '14 Kung Chong Road, Singapore 159150',
    description: 'MRT stations, viaducts, and large commercial construction contractor.',
  },
  {
    name: 'Straits Construction Singapore Pte Ltd',
    industry: 'Construction',
    address: '17 Tuas View Close, Singapore 637480',
    description: 'Public housing, PPVC modular construction, and industrial projects.',
  },
  {
    name: 'Greatearth Construction Pte Ltd',
    industry: 'Construction',
    address: '45B Jalan Bukit Merah, Singapore 169543',
    description: 'Design-and-build commercial, institutional, and industrial contractor.',
  },
  {
    name: 'Chip Eng Seng Contractors (1988) Pte Ltd',
    industry: 'Construction',
    address: '171 Chin Swee Road, Singapore 169877',
    description: 'HDB BTO flats, condominiums, and civil building construction.',
  },
  {
    name: 'Soilbuild Construction Group Ltd',
    industry: 'Construction',
    address: '23 Defu South Street 1, Singapore 533847',
    description: 'Industrial factories, business parks, and residential construction.',
  },
  {
    name: 'Teambuild Engineering & Construction Pte Ltd',
    industry: 'Construction',
    address: '9 Defu South Street 1, Singapore 533844',
    description: 'Prefabricated modular housing and residential construction contractor.',
  },
  {
    name: 'Obayashi Singapore Pte Ltd',
    industry: 'Construction',
    address: '80 Marine Parade Road, Singapore 449269',
    description: 'Japanese engineering and MRT/tunneling/high-rise builder in Singapore.',
  },
  {
    name: 'Penta-Ocean Construction Co Ltd',
    industry: 'Construction',
    address: '100 Beach Road, Singapore 189702',
    description: 'Marine civil works, reclamation, MRT tunnels, and port construction.',
  },
  {
    name: 'Shimizu Corporation (Singapore)',
    industry: 'Construction',
    address: '10 Anson Road, Singapore 079903',
    description: 'Large infrastructure, cleanroom factories, and commercial tower builder.',
  },
  {
    name: 'Takenaka Corporation (Singapore)',
    industry: 'Construction',
    address: '435 Orchard Road, Singapore 238877',
    description: 'Commercial complexes, Changi Airport terminals, and industrial works.',
  },
  {
    name: 'Kajima Overseas Asia Pte Ltd',
    industry: 'Construction',
    address: '75 Bukit Timah Road, Singapore 229833',
    description: 'Data centres, industrial plants, and commercial developments.',
  },
  {
    name: 'Dragages Singapore Pte Ltd',
    industry: 'Construction',
    address: '215 Henderson Road, Singapore 159554',
    description: 'Large civil engineering, tunneling, and commercial design-build firm.',
  },
  {
    name: 'Gammon Pte Ltd',
    industry: 'Construction',
    address: '101 Thomson Road, Singapore 307591',
    description: 'Foundation piling, MRT infrastructure, and deep excavation works.',
  },
  {
    name: 'Hyundai Engineering & Construction Co Ltd',
    industry: 'Construction',
    address: '300 Beach Road, Singapore 199555',
    description: 'Mega infrastructure, Tuas Port reclamation, and expressway works.',
  },
  {
    name: 'Samsung C&T Corporation (Singapore)',
    industry: 'Construction',
    address: '1 HarbourFront Place, Singapore 098633',
    description: 'MRT lines, underground caverns, and mega commercial developments.',
  },
  {
    name: 'Rotary Engineering Pte Ltd',
    industry: 'Process',
    address: '17 Tuas Avenue 20, Singapore 638828',
    description: 'Oil & gas tankage, Jurong Island process piping, and petrochemical EPC.',
  },
  {
    name: 'Hiap Seng Engineering Ltd',
    industry: 'Process',
    address: '28 Tuas Crescent, Singapore 638719',
    description: 'Process plant maintenance, piping fabrication, and Jurong Island shutdowns.',
  },
  {
    name: 'Mun Siong Engineering Limited',
    industry: 'Process',
    address: '35 Tuas Road, Singapore 638496',
    description: 'Mechanical maintenance, scaffolding, and turnaround services on Jurong Island.',
  },
  {
    name: 'PEC Ltd',
    industry: 'Process',
    address: '21 Shipyard Road, Singapore 628144',
    description: 'Process plant engineering, fabrication, and oil & gas maintenance.',
  },
  {
    name: 'Hai Leck Holdings Limited',
    industry: 'Process',
    address: '47 Tuas View Walk 2, Singapore 637887',
    description: 'Thermal insulation, scaffolding, and corrosion protection on Jurong Island.',
  },
  {
    name: 'Dyna-Mac Engineering Services Pte Ltd',
    industry: 'Marine Shipyard',
    address: '59 Gul Road, Singapore 629354',
    description: 'FPSO topside module fabrication and marine steelworks in Gul Road.',
  },
  {
    name: 'ASL Marine Holdings Ltd',
    industry: 'Marine Shipyard',
    address: '19 Pandan Road, Singapore 609271',
    description: 'Shipbuilding, ship repair, and marine vessel engineering in Pandan.',
  },
  {
    name: 'Mencast Marine Pte Ltd',
    industry: 'Marine Shipyard',
    address: '42E Penjuru Road, Singapore 609161',
    description: 'Sterngear fabrication, offshore engineering, and marine MRO.',
  },
  {
    name: 'Beng Kuang Marine Limited',
    industry: 'Marine Shipyard',
    address: '2 Venture Drive, Singapore 608526',
    description: 'Corrosion prevention, blasting/painting, and marine scaffolding.',
  },
  {
    name: 'BBR Construction Systems Pte Ltd',
    industry: 'Construction',
    address: '50 Changi South Street 1, Singapore 486126',
    description: 'Post-tensioning, precast concrete, and structural strengthening works.',
  },
  {
    name: 'Yongnam Engineering & Construction Pte Ltd',
    industry: 'Construction',
    address: '51 Tuas South Street 5, Singapore 637644',
    description: 'Structural steel fabrication, strutting, and mega bridge/airport steelworks.',
  },
  {
    name: 'Peck Brothers Construction Pte Ltd',
    industry: 'Construction',
    address: '3007 Ubi Road 1, Singapore 408701',
    description: 'Residential, industrial building, and A&A renovation contractor.',
  },
  {
    name: 'Chuan Lim Construction Pte Ltd',
    industry: 'Construction',
    address: '20 Kranji Road, Singapore 739462',
    description: 'Earthworks, roadworks, drainage, and civil infrastructure contractor.',
  },
  {
    name: 'Boustead Projects E&C Pte Ltd',
    industry: 'Construction',
    address: '82 Ubi Avenue 4, Singapore 408832',
    description: 'Industrial logistics hubs, semiconductor cleanrooms, and business parks.',
  },
  {
    name: 'Jurong Engineering Limited',
    industry: 'Process',
    address: '25 Tanjong Kling Road, Singapore 628050',
    description: 'Power plant, waste-to-energy, and heavy mechanical erection engineering.',
  },
  {
    name: 'Sembcorp Environment Pte Ltd',
    industry: 'Services',
    address: '30 Hill Street, Singapore 179360',
    description: 'Environmental services, waste management, and industrial cleaning.',
  },
  {
    name: 'Chye Thiam Maintenance Pte Ltd',
    industry: 'Services',
    address: '133 New Bridge Road, Singapore 059413',
    description: 'Public cleaning, conservancy, landscape, and municipal maintenance.',
  },
  {
    name: 'SATS Ltd',
    industry: 'Services',
    address: '20 Airport Boulevard, Singapore 819659',
    description: 'Aviation ground handling, cargo logistics, and Changi Airport services.',
  },
  {
    name: 'Venture Manufacturing (Singapore) Ltd',
    industry: 'Manufacturing',
    address: '5006 Ang Mo Kio Avenue 5, Singapore 569873',
    description: 'Electronics assembly, precision manufacturing, and industrial production.',
  },
];

export const STARTER_COMPANY_REVIEWS: CompanyReview[] = [
  {
    id: 'seed-rev-1',
    userId: 'seed-worker-1',
    companyName: 'Woh Hup (Private) Limited',
    industry: 'Construction',
    ratingWorkEnv: 4,
    ratingSalaryPayment: 5,
    ratingAccommodation: 4,
    ratingManagement: 4,
    title: 'Salary paid on time and strict safety gear provided',
    comment:
      'Monthly basic salary and OT arrive on time via bank GIRO with itemised payslip. Safety briefings every morning and proper PPE supplied.',
    employmentStatus: 'Current Worker',
    status: 'approved',
    likesCount: 6,
    createdAt: 1730000000000,
  },
  {
    id: 'seed-rev-2',
    userId: 'seed-worker-2',
    companyName: 'Seatrium Limited (Tuas Yard)',
    industry: 'Marine Shipyard',
    ratingWorkEnv: 4,
    ratingSalaryPayment: 5,
    ratingAccommodation: 4,
    ratingManagement: 4,
    title: 'Clear overtime tracking and shuttle bus from dorm',
    comment:
      'Clock-in / clock-out system is transparent. Good safety compliance for hot work and confined space. Canteen and shuttle transport available.',
    employmentStatus: 'Former Worker',
    status: 'approved',
    likesCount: 4,
    createdAt: 1730500000000,
  },
];

export const OFFLINE_HELP_GUIDES: HelpArticle[] = [
  {
    id: 'guide-salary-ot',
    title: 'Singapore Salary, Itemised Payslip & Overtime Rights (Work Permit)',
    category: 'salary',
    summary:
      'Every worker covered by the Employment Act must receive itemised payslips and salary within 7 days after the salary period.',
    content:
      'Keep daily records of your start time, end time, breaks, and rest days in your Time Card. Your employer must issue itemised payslips showing basic salary, allowances, overtime pay, and authorized deductions. Under the Employment Act, overtime must be paid within 14 days after the end of the salary period. If salary is delayed or unpaid, contact TADM / MOM (6438 5122) or MWC early while keeping photos of your work cards.',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mom.gov.sg/employment-practices/salary',
    likesCount: 0,
    createdAt: 1700000000000,
  },
  {
    id: 'guide-wica-injury',
    title: 'What to Do After a Worksite Injury (WICA & Medical Leave)',
    category: 'safety',
    summary:
      'Report workplace accidents immediately to your supervisor, seek medical care, and never sign papers you do not understand.',
    content:
      'Under Singapore WICA rules, work-related injuries are covered for medical expenses, hospitalisation leave wages, and permanent incapacity compensation by the employer insurer. Always request a copy of your MC, hospital discharge summary, and X-ray notes, and save photos in your Document Vault. If your employer tries to send you home before treatment completes, call MOM (6438 5122), MWC (6536 2692), or TWC2 immediately.',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mom.gov.sg/workplace-safety-and-health/work-injury-compensation',
    likesCount: 0,
    createdAt: 1700000000001,
  },
  {
    id: 'guide-bangla-rights',
    title: 'বেতন, ওভারটাইম ও ছুটির নিয়ম — প্রবাসী কর্মীদের জরুরি গাইড',
    category: 'salary',
    summary:
      'মাস শেষ হওয়ার ৭ দিনের মধ্যে বেতন এবং প্রতি মাসে আইটেমাইজড পে-স্লিপ পাওয়া আপনার আইনগত অধিকার।',
    content:
      'প্রতিদিনের কাজের সময়, ব্রেক এবং ওভারটাইম নিয়মিত টাইম কার্ডে লিখে রাখুন। পে-স্লিপ, আইপিএ (IPA) ও ওয়ার্ক পারমিটের ছবি ডকুমেন্ট ভল্টে সংরক্ষণ করুন। কোনো কোম্পানি মূল পাসপোর্ট আটকে রাখতে পারে না। বেতন বকেয়া হলে, বিনা কারণে দেশে পাঠাতে চাইলে বা কাজে আঘাত পেলে MOM (6438 5122) অথবা MWC ২৪ ঘণ্টার হেল্পলাইনে (6536 2692) কল করুন।',
    language: 'bn',
    authorLabel: 'WorkerHub অফলাইন গাইড',
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker',
    likesCount: 0,
    createdAt: 1700000000002,
  },
  {
    id: 'guide-bangla-wica',
    title: 'কাজের সাইটে দুর্ঘটনা বা আঘাত পেলে কী করবেন (WICA ও মেডিকেল ছুটি)',
    category: 'safety',
    summary:
      'আঘাত পেলে সাথে সাথে সুপারভাইজারকে জানান, ডাক্তারের এমসি (MC) কপি রাখুন এবং না বুঝে কোনো কাগজে সই করবেন না।',
    content:
      'সিঙ্গাপুরের WICA আইন অনুযায়ী কাজের সময় আহত হলে চিকিৎসা খরচ ও এমসি চলাকালীন বেতন কোম্পানির ইন্স্যুরেন্স বহন করে। হাসপাতালের কাগজ, এমসি এবং দুর্ঘটনাস্থলের ছবি ফোনে সংরক্ষণ করুন। চিকিৎসা শেষ হওয়ার আগে কেউ জোর করে টিকিট কেটে দিলে MOM বা TWC2/HOME সংস্থায় সাহায্য নিন।',
    language: 'bn',
    authorLabel: 'WorkerHub অফলাইন গাইড',
    sourceUrl: 'https://www.mom.gov.sg/workplace-safety-and-health/work-injury-compensation',
    likesCount: 0,
    createdAt: 1700000000003,
  },
  {
    id: 'guide-passport-ipa',
    title: 'Passport Safety, IPA Letter & Work Permit Renewal Rules',
    category: 'general',
    summary:
      'Employers are not allowed to keep your original passport without your written consent, and must give you a copy of your IPA.',
    content:
      'Always keep clear front-and-back photos of your Work Permit (FIN), Passport biodata page, and In-Principle Approval (IPA) letter stored offline in your WorkerHub Document Vault. An employer cannot illegally deduct agency kickbacks or levy charges from your salary.',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker',
    likesCount: 0,
    createdAt: 1700000000004,
  },
  {
    id: 'guide-restday-ph',
    title: 'Rest Days, Sunday Work & Singapore Public Holiday Rules',
    category: 'salary',
    summary:
      'Workers are entitled to 1 rest day per week and 11 gazetted Singapore public holidays per year.',
    content:
      'If you work on your scheduled rest day at the employer’s request, extra pay rules apply (typically 2x daily basic rate for full day, or 1x extra if requested by worker). On Public Holidays, you are entitled to either an extra day of basic salary or a substitute off-in-lieu day.',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days',
    likesCount: 0,
    createdAt: 1700000000005,
  },
  {
    id: 'guide-dormitory-welfare',
    title: 'Dormitory Living Standards, Ventilation & Drinking Water',
    category: 'housing',
    summary:
      'Approved dormitories must provide safe sanitation, clean toilets, cooking/canteen hygiene, and proper bed spacing.',
    content:
      'If your dormitory suffers from broken toilets, bedbugs, unsafe wiring, or spoiled catered food, take dated photos and report first to dormitory management or via FWMOMCare / MOM (6438 5122) or MWC (6536 2692).',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/housing',
    likesCount: 0,
    createdAt: 1700000000006,
  },
  {
    id: 'guide-remit-safe',
    title: 'Safe Remittance to Bangladesh & Avoiding Scams',
    category: 'remittance',
    summary:
      'Only send money through MAS-licensed remittance operators, Mustang/bank apps, or official POSB/DBS channels.',
    content:
      'Never transfer money through unverified Facebook/WhatsApp/TikTok agents promising unusually high BDT exchange rates. Always save official remittance receipts and track every transfer inside your Finance Tracker.',
    language: 'en',
    authorLabel: 'WorkerHub Offline Guide',
    sourceUrl: 'https://www.mas.gov.sg/',
    likesCount: 0,
    createdAt: 1700000000007,
  },
];
