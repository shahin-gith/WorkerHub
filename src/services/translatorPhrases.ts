export interface PhraseItem {
  id: string;
  category: 'work' | 'safety' | 'medical' | 'salary' | 'dorm';
  en: string;
  bn: string;
  pronounce: string; // Phonetic guide for Bengali speakers speaking English or vice-versa
}

export const WORKPLACE_PHRASES: PhraseItem[] = [
  // Safety & Emergency
  {
    id: 'ph-1',
    category: 'safety',
    en: 'Stop work immediately! It is not safe.',
    bn: 'কাজ এখনই থামান! এটি নিরাপদ নয়।',
    pronounce: 'স্টপ ওয়ার্ক ইমিডিয়েটলি! ইট ইজ নট সেইফ।',
  },
  {
    id: 'ph-2',
    category: 'safety',
    en: 'I need to wear my safety harness before working at height.',
    bn: 'উঁচুতে কাজ করার আগে আমার সেফটি হারনেস পরতে হবে।',
    pronounce: 'আই নিড টু ওয়্যার মাই সেইফটি হারনেস বিফোর ওয়ার্কিং অ্যাট হাইট।',
  },
  {
    id: 'ph-3',
    category: 'safety',
    en: 'Where is the assembly point in case of fire?',
    bn: 'আগুনের বিপদ ঘটলে সবাই একত্র হওয়ার স্থান (অ্যাসেম্বলি পয়েন্ট) কোথায়?',
    pronounce: 'হোয়্যার ইজ দ্য অ্যাসেম্বলি পয়েন্ট ইন কেস অফ ফায়ার?',
  },
  {
    id: 'ph-4',
    category: 'safety',
    en: 'This scaffold is not tagged green. We cannot climb it.',
    bn: 'এই স্ক্যাফোল্ডে গ্রিন ট্যাগ লাগানো নেই। আমরা উঠতে পারব না।',
    pronounce: 'দিস স্ক্যাফোল্ড ইজ নট ট্যাগড গ্রিন। উই ক্যাননট ক্লাইম্ব ইট।',
  },
  {
    id: 'ph-5',
    category: 'safety',
    en: 'Please provide new safety gloves and goggles.',
    bn: 'দয়া করে নতুন সেফটি গ্লাভস এবং চশমা (গগলস) দিন।',
    pronounce: 'প্লিজ প্রোভাইড নিউ সেইফটি গ্লাভস অ্যান্ড গগলস।',
  },

  // Worksite & Tools
  {
    id: 'ph-6',
    category: 'work',
    en: 'What is the schedule and target for today?',
    bn: 'আজকের কাজের শিডিউল ও লক্ষ্য কী?',
    pronounce: 'হোয়াট ইজ দ্য শিডিউল অ্যান্ড টার্গেট ফর টুডে?',
  },
  {
    id: 'ph-7',
    category: 'work',
    en: 'The concrete mixer is not working properly.',
    bn: 'কংক্রিট মিক্সার মেশিনটি ঠিকমতো কাজ করছে না।',
    pronounce: 'দ্য কনক্রিট মিক্সার ইজ নট ওয়ার্কিং প্রপারলি।',
  },
  {
    id: 'ph-8',
    category: 'work',
    en: 'Please check this measurement drawing before we cut.',
    bn: 'কাটার আগে দয়া করে এই মাপের ড্রয়িংটি যাচাই করুন।',
    pronounce: 'প্লিজ চেক দিস মেজারমেন্ট ড্রয়িং বিফোর উই কাট।',
  },
  {
    id: 'ph-9',
    category: 'work',
    en: 'We have finished this floor. Where should we shift the materials?',
    bn: 'আমাদের এই ফ্লোরের কাজ শেষ। মালপত্র কোথায় সরাতে হবে?',
    pronounce: 'উই হ্যাভ ফিনিশড দিস ফ্লোর। হোয়্যার শুড উই শিফট দ্য মেটেরিয়ালস?',
  },

  // Medical & Clinic
  {
    id: 'ph-10',
    category: 'medical',
    en: 'I feel very dizzy and weak from the extreme heat.',
    bn: 'তীব্র গরমে আমার মাথা খুব ঘুরছে এবং দুর্বল লাগছে।',
    pronounce: 'আই ফিল ভেরি ডিজি অ্যান্ড উইক ফ্রম দ্য এক্সট্রিম হিট।',
  },
  {
    id: 'ph-11',
    category: 'medical',
    en: 'I had an accident and injured my lower back and finger.',
    bn: 'আমার দুর্ঘটনা ঘটেছে এবং কোমরে ও আঙুলে আঘাত লেগেছে।',
    pronounce: 'আই হ্যাড অ্যান অ্যাক্সিডেন্ট অ্যান্ড ইনজুরড মাই লোয়ার ব্যাক অ্যান্ড ফিঙ্গার।',
  },
  {
    id: 'ph-12',
    category: 'medical',
    en: 'The doctor gave me two days of Medical Leave (MC).',
    bn: 'ডাক্তার আমাকে দুই দিনের বিশ্রামের ছুটি (MC) দিয়েছেন।',
    pronounce: 'দ্য ডক্টর গেইভ মি টু ডেজ অফ মেডিকেল লিভ (এমসি)।',
  },
  {
    id: 'ph-13',
    category: 'medical',
    en: 'Can you please issue a referral letter for a hospital checkup?',
    bn: 'হাসপাতালে পরীক্ষার জন্য একটি রেফারেল লেটার দিতে পারবেন কি?',
    pronounce: 'ক্যান ইউ প্লিজ ইস্যু আ রেফারাল লেটার ফর আ হসপিটাল চেকআপ?',
  },

  // Salary & MOM Rights
  {
    id: 'ph-14',
    category: 'salary',
    en: 'Please sign and stamp my monthly time card record.',
    bn: 'দয়া করে আমার মাসিক টাইম কার্ডে সই ও সিল দিন।',
    pronounce: 'প্লিজ সাইন অ্যান্ড স্ট্যাম্প মাই মান্থলি টাইম কার্ড রেকর্ড।',
  },
  {
    id: 'ph-15',
    category: 'salary',
    en: 'My overtime hours on Sunday were not included in this payslip.',
    bn: 'এই পে-স্লিপে আমার রবিবারের ওভারটাইমের ঘণ্টাগুলো যোগ করা হয়নি।',
    pronounce: 'মাই ওভারটাইম আওয়ার্স অন সানডে ওয়্যার নট ইনক্লুডেড ইন দিস পে-স্লিপ।',
  },
  {
    id: 'ph-16',
    category: 'salary',
    en: 'According to my In-Principle Approval (IPA), my basic salary is $950.',
    bn: 'আমার ইন-প্রিন্সিপল অ্যাপ্রুভাল (IPA) অনুযায়ী আমার বেসিক বেতন ৯৫০ ডলার।',
    pronounce: 'অ্যাকর্ডিং টু মাই ইন-প্রিন্সিপল অ্যাপ্রুভাল, মাই বেসিক স্যালারি ইজ নাইন ফিফটি ডলার।',
  },
  {
    id: 'ph-17',
    category: 'salary',
    en: 'Can I have an itemized payslip for last month?',
    bn: 'গত মাসের বেতনের বিস্তারিত আইটেমাইজড পে-স্লিপ পেতে পারি কি?',
    pronounce: 'ক্যান আই হ্যাভ অ্যান আইটেমাইজড পে-স্লিপ ফর লাস্ট মান্থ?',
  },

  // Dormitory
  {
    id: 'ph-18',
    category: 'dorm',
    en: 'The room ceiling fan is not working. It is very hot.',
    bn: 'রুমের সিলিং ফ্যান নষ্ট। রুমে প্রচুর গরম।',
    pronounce: 'দ্য রুম সিলিং ফ্যান ইজ নট ওয়ার্কিং। ইট ইজ ভেরি হট।',
  },
  {
    id: 'ph-19',
    category: 'dorm',
    en: 'The bathroom water pipe has a leak.',
    bn: 'গোসলখানার পানির পাইপ থেকে পানি লিক করছে।',
    pronounce: 'দ্য বাথরুম ওয়াটার পাইপ হ্যাজ আ লিক।',
  },
  {
    id: 'ph-20',
    category: 'dorm',
    en: 'What time is the dormitory gate locked tonight?',
    bn: 'আজ রাতে ডরমিটরির গেট কখন বন্ধ হবে?',
    pronounce: 'হোয়াট টাইম ইজ দ্য ডরমিটরি গেইট লকড টুনাইট?',
  },
];
