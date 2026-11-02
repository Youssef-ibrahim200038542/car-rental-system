<?php

namespace App\Services;

/**
 * Words the keyword parser recognises, in English, Egyptian Arabic and
 * Franco-Arabic (Arabic written in Latin letters and digits).
 *
 * Arabic entries are written as KeywordPreferenceParser::normalise() leaves them
 * (أ/إ/آ → ا, ة → ه, ى → ي), and are matched as substrings so attached
 * prefixes like ب / ال / و still match. Latin entries only match as whole
 * words.
 */
final class PreferenceLexicon
{
    public const NUMBER_WORDS = [
        'one' => 1, 'two' => 2, 'three' => 3, 'four' => 4, 'five' => 5, 'six' => 6, 'seven' => 7,
        'eight' => 8, 'nine' => 9, 'ten' => 10, 'eleven' => 11, 'twelve' => 12, 'fourteen' => 14,
        'fifteen' => 15, 'twenty' => 20, 'thirty' => 30,
        'واحد' => 1, 'واحده' => 1, 'اتنين' => 2, 'اثنين' => 2, 'تلاته' => 3, 'تلات' => 3, 'ثلاثه' => 3,
        'ثلاث' => 3, 'اربعه' => 4, 'اربع' => 4, 'خمسه' => 5, 'خمس' => 5, 'سته' => 6, 'سبعه' => 7,
        'سبع' => 7, 'تمانيه' => 8, 'تمان' => 8, 'ثمانيه' => 8, 'تسعه' => 9, 'تسع' => 9, 'عشره' => 10,
        'عشر' => 10, 'الفين' => 2000,
        'wa7ed' => 1, 'wahed' => 1, 'etnen' => 2, 'etneen' => 2, 'itneen' => 2, 'talata' => 3,
        'tlata' => 3, 'talat' => 3, 'tlat' => 3, 'arba3a' => 4, 'arba3' => 4, 'khamsa' => 5,
        '5amsa' => 5, 'khamas' => 5, 'setta' => 6, 'sitta' => 6, 'sab3a' => 7, 'sab3' => 7,
        'tamanya' => 8, 'tamania' => 8, 'taman' => 8, 'tes3a' => 9, 'tis3a' => 9, '3ashara' => 10,
        'ashara' => 10, 'alfen' => 2000, 'alfein' => 2000, 'alfeen' => 2000,
    ];

    /** Words that multiply the number before them by 1000 ("15k", "15 الف", "15 alf"). */
    public const THOUSAND = ['k', 'thousand', 'الف', 'الاف', 'alf', 'alaf', 'aalaf'];

    /** Words that introduce a budget amount ("up to 1500", "في حدود 1500", "fe 7dod 1500"). */
    public const BUDGET_CUES = [
        'budget', 'spend', 'up to', 'upto', 'max', 'maximum', 'under', 'below', 'less than',
        'no more than', 'not more than', 'within', 'around', 'about', 'at most', 'cap', 'total',
        'ميزانيه', 'ميزانيتي', 'في حدود', 'حدود', 'لحد', 'اقصي', 'اقل من', 'مش اكتر من', 'تحت', 'حوالي',
        'mizanya', 'mizaneya', 'mezanya', 'mizanyti', 'mizaneyti', 'mezanyti', 'fe 7dod', 'f 7dod',
        '7dod', '7odod', 'l7d', 'le7ad', 'la7ad', 'a2al men', 'a2al mn', 'msh aktar men',
        'msh aktar mn', 'mesh aktar men', 'mesh aktar mn', 'ta7t', '7awaly', '7awali',
    ];

    /** Words after an amount that mark it as the whole-rental total ("20000 total"). */
    public const TOTAL = ['total', 'in total', 'overall', 'all in', 'اجمالي', 'الاجمالي', 'egmali', 'ekhmali'];

    /** Tight cue: "ب 1500" / "b 1500" means "for 1500". */
    public const PRICE_PREFIXES = ['ب', 'b', 'be', 'bi'];

    public const CURRENCY = [
        'egp', 'le', 'l.e', 'l.e.', 'pounds', 'pound', 'gneh', 'geneh', 'gnih', 'ginih', 'genih',
        'guineh', 'جنيه', 'جنيهات', 'ج.م', 'جم',
    ];

    /** Phrases that mark an amount as per day ("1500 a day", "1500 في اليوم", "1500 fel yom"). */
    public const PER_DAY = [
        'per day', 'a day', 'each day', 'for each day', '/day', '/ day', 'daily', 'per night', 'a night',
        'في اليوم', 'فاليوم', 'باليوم', 'لليوم', 'يوميا', 'يوميه', 'يومي', 'كل يوم', 'اليوم',
        'fel yom', 'fel youm', 'f el yom', 'fl yom', 'felyom', 'fe el yom', 'lel yom', 'el yom',
        'kol yom', 'yomeyan', 'yawmeyan', 'yomeya',
    ];

    public const SEAT_UNITS = [
        'people', 'persons', 'person', 'passengers', 'passenger', 'seats', 'seater', 'seat', 'adults',
        'pax', 'ppl', 'of us',
        'اشخاص', 'شخص', 'افراد', 'فرد', 'ركاب', 'راكب', 'كراسي', 'مقاعد', 'انفار', 'نفر',
        'afrad', 'ashkhas', 'ashkhaas', 'a4khas', 'nafar', 'anfar', 'rokab', 'kraasy', 'karasy',
    ];

    /** Words before a head count ("family of 5", "احنا 5", "e7na 5"). */
    public const GROUP_CUES = [
        'family of', 'group of', 'party of', 'we are', "we're",
        'عيله من', 'عائله من', 'احنا',
        '3eela men', '3ela men', '3ela mn', '3ayla men', 'e7na', 'ehna',
    ];

    /** Words before a bare head count ("for 4", "ل 4", "le 4"). */
    public const FOR_CUES = ['for', 'ل', 'le', 'li'];

    public const COUPLE = [
        'couple', 'me and my wife', 'me and my husband', 'my wife and me', 'my wife and i',
        'انا ومراتي', 'انا وجوزي', 'انا وزوجتي', 'زوجين',
        'ana w merati', 'ana w mrati', 'ana we merati', 'ana w gozy', 'ana w gozi',
    ];

    public const SOLO = ['just me', 'only me', 'لوحدي', 'lwa7di', 'lewa7di', 'lewa7dy', 'lwa7dy'];

    public const DAY_UNITS = [
        'days', 'day', 'nights', 'night', 'ايام', 'يوم', 'ليالي', 'ليله',
        'youm', 'yom', 'yoom', 'ayam', 'ayyam', 'iyam', 'leyaly',
    ];

    public const WEEK_UNITS = ['weeks', 'week', 'اسابيع', 'اسبوع', 'esboo3', 'esbo3', 'osbo3', 'asabee3', 'asabe3'];

    public const MONTH_UNITS = ['months', 'month', 'شهور', 'اشهر', 'شهر', 'shahr', 'shohor', 'ashhor'];

    /** Whole-phrase durations, checked in order after number+unit patterns. */
    public const DURATION_PHRASES = [
        2 => ['يومين', 'youmen', 'yomen', 'yomein', 'yomeen', 'weekend', 'ويك اند', 'wikend'],
        14 => ['اسبوعين', 'esbo3en', 'esbo3een', 'osbo3en', 'esboo3en', 'fortnight'],
        60 => ['شهرين', 'shahren', 'shahrein'],
        30 => ['month', 'شهر', 'shahr'],
        7 => ['week', 'اسبوع', 'esbo3', 'esboo3', 'osbo3'],
        // "واحد" / "wa7ed" are already digits by the time phrases are checked.
        1 => ['a day', 'tomorrow', 'بكره', 'bokra', 'يوم 1', 'yom 1'],
    ];

    /** Checked in this order; the first value with a match wins. */
    public const FUEL = [
        'electric' => ['electric', 'electrical', 'ev', 'كهربا', 'kahraba', 'kahrba', 'kahrabaa'],
        'hybrid' => ['hybrid', 'hybird', 'hybred', 'هايبرد', 'هايبريد', 'هيبرد', 'haybrid', 'haibrid'],
        'diesel' => ['diesel', 'disel', 'dizel', 'ديزل', 'سولار', 'solar'],
        'petrol' => ['petrol', 'gasoline', 'gas', 'benzine', 'benzin', 'benzeen', 'banzeen', 'بنزين'],
    ];

    public const TRANSMISSION = [
        'automatic' => [
            'automatic', 'automatique', 'auto', 'automatik', 'otomatik', 'otomatic', 'automtic', 'automatc',
            'اوتوماتيك', 'اتوماتيك', 'اوتوماتك', 'اوتو',
        ],
        'manual' => ['manual', 'manuel', 'stick', 'stick shift', 'مانيوال', 'مانوال', 'عادي', 'يدوي', '3ady', '3adi', 'manyowal', 'manwal'],
    ];

    /**
     * Keyed by lower-cased category name. Checked most-specific first, so
     * "the cheapest SUV" is an SUV, not an economy car.
     */
    public const CATEGORY = [
        'luxury' => [
            'luxury', 'luxurious', 'premium', 'high-end', 'executive', 'prestige',
            'فخمه', 'فخم', 'لاكشري', 'لوكس', 'fakhma', 'fa5ma', 'fakhm', 'fa5m', 'laksheri', 'lux',
        ],
        'suv' => [
            'suv', '4x4', 'four by four', 'jeep', 'crossover', 'sport utility',
            'جيب', 'دفع رباعي', 'كروس اوفر', 'geep', 'jeeb',
        ],
        'sedan' => ['sedan', 'saloon', 'four-door', 'سيدان', 'sedaan', 'sidan'],
        'economy' => [
            'economy', 'economic', 'economical', 'cheap', 'cheapest', 'affordable', 'budget car',
            'small car', 'compact', 'اقتصادي', 'رخيص', 'e2tesady', 'eqtesady', 'iqtisadi', 'e2tsady',
            'r5esa', 'rekhisa', 'rkhisa', 're5isa', 're5eesa', 'ra5isa',
        ],
    ];
}
