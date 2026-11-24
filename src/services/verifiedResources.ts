export interface HelpResource {
  id: string;
  category: 'emergency' | 'mom' | 'embassy' | 'ngo' | 'medical';
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  phone: string;
  phoneDisplay: string;
  address?: string;
  website?: string;
  is24Hours?: boolean;
}

export const VERIFIED_RESOURCES: HelpResource[] = [
  {
    id: 'res-scdf',
    category: 'emergency',
    titleEn: 'SCDF Ambulance & Fire Emergency',
    titleBn: 'অ্যাম্বুলেন্স ও ফায়ার সার্ভিস (জরুরি)',
    descEn: 'For serious injuries, falls from height, severe burns, or sudden medical emergencies on worksites.',
    descBn: 'সাইটে গুরুতর দুর্ঘটনা, ওপর থেকে পড়ে যাওয়া, তীব্র রক্তক্ষরণ বা জীবন বাঁচানোর জন্য অবিলম্বে কল করুন।',
    phone: '995',
    phoneDisplay: '995',
    is24Hours: true,
  },
  {
    id: 'res-police',
    category: 'emergency',
    titleEn: 'Singapore Police Emergency',
    titleBn: 'সিঙ্গাপুর পুলিশ (জরুরি)',
    descEn: 'For immediate threat to personal safety, violence, robbery, or severe disputes.',
    descBn: 'শারীরিক হামলা, মারামারি, নিরাপত্তা সংকট বা গুরুতর বিপদের ক্ষেত্রে জরুরি পুলিশ সাহায্য।',
    phone: '999',
    phoneDisplay: '999',
    is24Hours: true,
  },
  {
    id: 'res-mom-hotline',
    category: 'mom',
    titleEn: 'MOM Helpline (Ministry of Manpower)',
    titleBn: 'মম (MOM) হেল্পলাইন — জনশক্তি মন্ত্রণালয়',
    descEn: 'Official government helpline for salary disputes, illegal deployment, work permit renewal, and employment rights.',
    descBn: 'বকেয়া বেতন, অবৈধভাবে অন্য সাইটে কাজ করানো, ওয়ার্ক পারমিট বাতিল বা অধিকারের বিষয়ে সরকারি পরামর্শ।',
    phone: '+6564385122',
    phoneDisplay: '6438 5122 / 1800-225-5666',
    address: '1500 Bendemeer Road, Singapore 339946 (MOM Services Centre)',
    website: 'https://www.mom.gov.sg',
    is24Hours: false,
  },
  {
    id: 'res-mwc',
    category: 'ngo',
    titleEn: "Migrant Workers' Centre (MWC)",
    titleBn: 'মাইগ্র্যান্ট ওয়ার্কার্স সেন্টার (MWC)',
    descEn: '24-hour distress helpline offering free shelter, meal assistance, and resolution for unfair employer treatment.',
    descBn: '২৪ ঘণ্টা চালু ফ্রি হেল্পলাইন। কোম্পানি খাবার না দিলে, থাকার জায়গা কেড়ে নিলে বা বিপদে পড়লে সাহায্য করে।',
    phone: '+6565362692',
    phoneDisplay: '6536 2692 (24-Hour Helpline)',
    address: '579 Serangoon Road, Singapore 218193',
    website: 'https://mwc.org.sg',
    is24Hours: true,
  },
  {
    id: 'res-bd-embassy',
    category: 'embassy',
    titleEn: 'High Commission of Bangladesh in Singapore',
    titleBn: 'বাংলাদেশ হাইকমিশন, সিঙ্গাপুর',
    descEn: 'Official embassy support: passport renewal, travel permit, labor wing welfare, and repatriation support.',
    descBn: 'পাসপোর্ট নবায়ন, ট্রাভেল পারমিট, শ্রম উইংয়ের মাধ্যমে আইনি সহায়তা ও দেশে ফেরার জরুরি যোগাযোগ।',
    phone: '+6562550075',
    phoneDisplay: '+65 6255 0075 (Labor Wing)',
    address: 'Jit Poh Building, 19 Keppel Road #04-00 / #10-00, Singapore 089058',
    website: 'https://singapore.mofa.gov.bd',
    is24Hours: false,
  },
  {
    id: 'res-twc2',
    category: 'ngo',
    titleEn: 'TWC2 (Transient Workers Count Too)',
    titleBn: 'টিডব্লিউসি২ (TWC2 - প্রবাসী শ্রমিক সংস্থা)',
    descEn: 'Free assistance for workplace injuries, WICA claims, unpaid salary calculation, and food support (Cuff Road).',
    descBn: 'কাজে আঘাতপ্রাপ্ত হলে ক্ষতিপূরণ দাবি (WICA), না দেওয়া বেতন উদ্ধার ও বিনামূল্যে খাবার সহায়তা।',
    phone: '+6560167562',
    phoneDisplay: '+65 6016 7562 / 1800-888-1515',
    website: 'https://twc2.org.sg',
    is24Hours: false,
  },
  {
    id: 'res-home',
    category: 'ngo',
    titleEn: 'HOME (Humanitarian Organization for Migration Economics)',
    titleBn: 'হোম (HOME - মাইগ্রেশন ইকোনমিক্স সংস্থা)',
    descEn: 'Legal aid, counseling, and direct representation for migrant workers facing salary withholding or abuse.',
    descBn: 'বেতন আটকে রাখা বা নিপীড়নের শিকার শ্রমিকদের জন্য বিনামূল্যে আইনি পরামর্শ ও কাউন্সেলিং।',
    phone: '+6563415525',
    phoneDisplay: '+65 6341 5525 / 1800-797-7977',
    website: 'https://www.home.org.sg',
    is24Hours: false,
  },
  {
    id: 'res-healthserve',
    category: 'medical',
    titleEn: 'HealthServe Community Clinic',
    titleBn: 'হেলথসার্ভ কমিউনিটি ক্লিনিক',
    descEn: 'Affordable, subsidized medical care, mental wellness counseling, and dental consultations for Work Permit holders.',
    descBn: 'প্রবাসী ভাইদের জন্য কম খরচে ডাক্তার দেখানো, ওষুধ ও মানসিক স্বাস্থ্য সহায়তা কেন্দ্র।',
    phone: '+6531295000',
    phoneDisplay: '+65 3129 5000',
    address: '1 Geylang Lorong 23, #01-01 Building 4, Singapore 388352',
    website: 'https://www.healthserve.org.sg',
    is24Hours: false,
  },
];
