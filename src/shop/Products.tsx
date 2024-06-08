import { ProductProps } from "../components/types";

const products: ProductProps[] = [
  {
    id: "1",
    category: "flowers",
    imageUrl: "product_1.png",
    name: "Blue Dream",
    rating: 4.5,
    strains: ["sleepy", "happy"],
    price: 9,
    description:
      "Blue Dream is a sativa-dominant hybrid marijuana strain made by crossing Blueberry with Haze. Blue Dream produces a balancing high accompanied by full-body relaxation with gentle cerebral invigoration. Novice and veteran consumers alike enjoy the calming and euphoric effects that Blue Dream provides. Consumers also love the flavor - which smells and tastes just like sweet berries. Medical marijuana patients say Blue Dream delivers swift relief from symptoms associated with pain, depression, and nausea.",
  },
  {
    id: "2",
    category: "flowers",
    imageUrl: "product_2.png",
    name: "Girl Scout Cookies",
    rating: 4.0,
    strains: ["hungry", "euphoric"],
    price: 8,
    description:
      "The Girl Scout Cookies strain is classified as a hybrid, with a 60% indica and 40% sativa genetic makeup. Its lineage hails from the mega-popular strains Durban Poison (a sativa) and OG Kush (a hybrid). The GSC buds grown and sent into labs for testing have shown results of a 17-28% THC content (rather high for a smoking strain), and a CBD content of 0.09-0.2% (low in CBD).",
  },
  {
    id: "3",
    category: "flowers",
    imageUrl: "product_3.png",
    name: "OG Kush",
    rating: 5.0,
    strains: ["relaxed", "uplifted"],
    price: 11,
    description:
      "OG Kush was first cultivated in Florida, in the early ‘90s when a strain from Northern California was crossed with a Hindu Kush plant from Amsterdam. The result was a hybrid with a unique terpene profile that boasts a complex aroma with notes of fuel, skunk, and spice. The genetic backbone of West Coast cannabis varieties, OG Kush arrived in Los Angeles in 1996 when Matt “Bubba” Berger brought it (along with “The Bubba,” which was later used to create the famed Bubba Kush) from Florida to legendary cultivator Josh D. Since then, OG Kush has become a worldwide staple used to create numerous famous strains like GSC and Headband.",
  },
  {
    id: "4",
    category: "flowers",
    imageUrl: "product_4.png",
    name: "Sour Diesel",
    rating: 3,
    strains: ["creative", "focused"],
    price: 5,
    description:
      "Sour Diesel, sometimes called Sour D, is an invigorating sativa-dominant strain named after its pungent, diesel-like aroma. This fast-acting strain delivers energizing, dreamy cerebral effects that have pushed Sour Diesel to its legendary status. Stress, pain, and depression fade away in long-lasting relief that makes Sour Diesel a top choice among medical patients. This strain took root in the early '90s, and it is believed to have descended from Chemdog 91 and Super Skunk.",
  },
  {
    id: "5",
    category: "flowers",
    imageUrl: "product_5.png",
    name: "Cheese Quake",
    rating: 5,
    strains: ["energetic", "talkative"],
    price: 7.5,
    description:
      "Cheese Quake by TGA Subcool Seeds is a 60/40 indica-dominant cross between Cheese and Querkle. A hint of grape is detectable, but its aroma is led by the funky sour aroma commonly associated with Cheese hybrids. Expect to feel tingy invigoration followed by uplifting body sensations to help you feel relaxed and carefree.",
  },
  {
    id: "6",
    category: "flowers",
    imageUrl: "product_6.png",
    name: "Pineapple Express",
    rating: 4.5,
    strains: ["tingly", "aroused"],
    price: 9,
    description:
      "Pineapple Express combines the potent and flavorful forces of parent strains Trainwreck and Hawaiian. The smell is likened to fresh apple and mango, with a taste of pineapple, pine, and cedar. This hard-hitting sativa-dominant hybrid provides a long-lasting energetic buzz perfect for productive afternoons and creative escapes.",
  },
  {
    id: "7",
    category: "flowers",
    imageUrl: "product_7.png",
    name: "Purple Haze",
    rating: 4.2,
    strains: ["energetic", "happy"],
    price: 10,
    description:
      "Purple Haze is a sativa marijuana strain popularized by Jimi Hendrix’s 1967 classic song. This strain delivers a dreamy burst of euphoria that brings veteran consumers back to their psychedelic heyday. Its buds typically acquire vibrant hues of lavender that justify the name of this strain.",
  },
  {
    id: "8",
    category: "flowers",
    imageUrl: "product_8.png",
    name: "Green Crack",
    rating: 4.8,
    strains: ["focused", "happy"],
    price: 9.5,
    description:
      "Don’t let the name fool you: this is pure cannabis. Few strains compare to Green Crack’s sharp energy and focus as it induces an invigorating mental buzz that keeps you going throughout the day. With a tangy, fruity flavor redolent of mango, Green Crack is the perfect daytime medication for patients treating fatigue, stress, and depression.",
  },
  {
    id: "9",
    category: "flowers",
    imageUrl: "product_9.png",
    name: "Super Lemon Haze",
    rating: 4.7,
    strains: ["energetic", "creative"],
    price: 8.5,
    description:
      "A sativa-dominant hybrid of Lemon Skunk and Super Silver Haze, Super Lemon Haze is a kief-caked multi-colored wonder. As the name states, this strain has real lemony characteristics. The smell is zesty, citrusy, and a little sweet. The same characteristics can be found in Super Lemon Haze’s taste, which is tart and sweet like Lemonheads candy.",
  },
  {
    id: "10",
    category: "flowers",
    imageUrl: "product_10.png",
    name: "AK-47",
    rating: 4.9,
    strains: ["relaxed", "happy"],
    price: 10,
    description:
      "Don’t let its intense name fool you: AK-47 will leave you relaxed and mellow. This sativa-dominant hybrid delivers a steady and long-lasting cerebral buzz that keeps you mentally alert and engaged in creative or social activities. AK-47 mixes Colombian, Mexican, Thai, and Afghani varieties, bringing together a complex blend of flavors and effects.",
  },
  {
    id: "11",
    category: "hash",
    imageUrl: "product_11.jpg",
    name: "Afghan Hash",
    rating: 4.6,
    strains: ["relaxed", "euphoric"],
    price: 15,
    description:
      "Afghan Hash is produced in Afghanistan, where the cultivation of hashish has become a cultural tradition. Known for its high THC content and strong effects, Afghan Hash is loved for its smooth, robust flavor and potent effects.",
  },
  {
    id: "12",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Moroccan Hash",
    rating: 4.3,
    strains: ["happy", "relaxed"],
    price: 13,
    description:
      "Moroccan Hash, or 'kif', is a classic hash strain originating from Morocco. It's known for its golden color and soft texture, delivering a smooth, relaxing high with a pleasant, earthy flavor.",
  },
  {
    id: "13",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Lebanese Hash",
    rating: 4.7,
    strains: ["happy", "creative"],
    price: 14,
    description:
      "Lebanese Hash is known for its red and blonde varieties, with the red hash being more aged. This hash has a unique flavor profile and provides a potent, long-lasting high that is both relaxing and euphoric.",
  },
  {
    id: "14",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Charas",
    rating: 4.5,
    strains: ["relaxed", "focused"],
    price: 12,
    description:
      "Charas is a type of hashish handmade in the Indian subcontinent. It is made from the resin of the cannabis plant. Charas is usually made from a strain of cannabis found in the Himalayas, and it is known for its smooth, relaxing effects and distinctive spicy aroma.",
  },
  {
    id: "15",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Bubble Hash",
    rating: 4.8,
    strains: ["happy", "relaxed"],
    price: 16,
    description:
      "Bubble Hash is a type of hash made by extracting the resin from the cannabis plant using ice water. It's known for its high potency and clean, flavorful smoke. Bubble Hash gets its name from the way it bubbles when exposed to flame.",
  },
  {
    id: "16",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Nepalese Hash",
    rating: 4.4,
    strains: ["happy", "uplifted"],
    price: 14.5,
    description:
      "Nepalese Hash is known for its smooth and creamy texture and its sweet, aromatic flavor. This hash provides a potent, relaxing high that is perfect for unwinding after a long day.",
  },
  {
    id: "17",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Indian Hash",
    rating: 4.2,
    strains: ["relaxed", "happy"],
    price: 13.5,
    description:
      "Indian Hash, or 'charas', is hand-rolled from the resin of the cannabis plant. It has a soft, pliable texture and a rich, earthy flavor. Indian Hash provides a relaxing, euphoric high that is perfect for socializing or unwinding.",
  },
  {
    id: "18",
    category: "hash",
    imageUrl: "product_12.jpeg",
    name: "Jamaican Hash",
    rating: 4.5,
    strains: ["uplifted", "happy"],
    price: 15.5,
    description:
      "Jamaican Hash is known for its distinctive flavor and potent effects. Made from the resin of the cannabis plant, Jamaican Hash provides a smooth, relaxing high that is perfect for unwinding and socializing.",
  },
  {
    id: "19",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "CBD Oil",
    rating: 4.8,
    strains: ["relaxed", "focused"],
    price: 20,
    description:
      "CBD Oil is made from the cannabidiol compound found in the cannabis plant. It's known for its therapeutic properties, providing relief from pain, anxiety, and inflammation without the psychoactive effects of THC.",
  },
  {
    id: "20",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "THC Oil",
    rating: 4.7,
    strains: ["euphoric", "relaxed"],
    price: 22,
    description:
      "THC Oil is made from the tetrahydrocannabinol compound found in the cannabis plant. It's known for its psychoactive effects, providing a potent, long-lasting high that is perfect for relaxation and pain relief.",
  },
  {
    id: "21",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Rick Simpson Oil",
    rating: 4.9,
    strains: ["relaxed", "happy"],
    price: 25,
    description:
      "Rick Simpson Oil is a potent cannabis extract known for its high THC content and therapeutic properties. It's named after Rick Simpson, who popularized its use for treating a variety of medical conditions.",
  },
  {
    id: "22",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Hemp Oil",
    rating: 4.5,
    strains: ["focused", "happy"],
    price: 18,
    description:
      "Hemp Oil is made from the seeds of the hemp plant. It's rich in essential fatty acids and has numerous health benefits. Hemp Oil is known for its nutty flavor and is often used as a dietary supplement.",
  },
  {
    id: "23",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Full Spectrum Oil",
    rating: 4.6,
    strains: ["relaxed", "euphoric"],
    price: 24,
    description:
      "Full Spectrum Oil contains a wide range of cannabinoids, including CBD and THC, as well as other beneficial compounds found in the cannabis plant. This oil provides a potent, well-rounded effect that is perfect for therapeutic use.",
  },
  {
    id: "24",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Broad Spectrum Oil",
    rating: 4.4,
    strains: ["happy", "focused"],
    price: 23,
    description:
      "Broad Spectrum Oil contains a wide range of cannabinoids and other beneficial compounds found in the cannabis plant, but with the THC removed. This oil provides the therapeutic benefits of cannabinoids without the psychoactive effects of THC.",
  },
  {
    id: "25",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Isolate Oil",
    rating: 4.3,
    strains: ["relaxed", "focused"],
    price: 21,
    description:
      "Isolate Oil is made from pure CBD isolate, which contains no other cannabinoids or compounds. This oil provides the therapeutic benefits of CBD without any THC or other cannabinoids.",
  },
  {
    id: "26",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Cannabis Oil",
    rating: 4.7,
    strains: ["euphoric", "relaxed"],
    price: 22.5,
    description:
      "Cannabis Oil is made from the whole cannabis plant and contains a wide range of cannabinoids, including THC and CBD. This oil provides a potent, well-rounded effect that is perfect for therapeutic use.",
  },
  {
    id: "27",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "CBD Isolate Oil",
    rating: 4.5,
    strains: ["happy", "relaxed"],
    price: 20.5,
    description:
      "CBD Isolate Oil is made from pure CBD isolate, which contains no other cannabinoids or compounds. This oil provides the therapeutic benefits of CBD without any THC or other cannabinoids.",
  },
  {
    id: "28",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "THC Free Oil",
    rating: 4.3,
    strains: ["focused", "happy"],
    price: 21.5,
    description:
      "THC Free Oil contains a wide range of cannabinoids and other beneficial compounds found in the cannabis plant, but with the THC removed. This oil provides the therapeutic benefits of cannabinoids without the psychoactive effects of THC.",
  },
  {
    id: "29",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Delta-8 Oil",
    rating: 4.6,
    strains: ["euphoric", "relaxed"],
    price: 23.5,
    description:
      "Delta-8 Oil is made from the Delta-8 THC compound found in the cannabis plant. It's known for its mild psychoactive effects, providing a relaxing, euphoric high that is less intense than Delta-9 THC.",
  },
  {
    id: "30",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "CBG Oil",
    rating: 4.4,
    strains: ["focused", "happy"],
    price: 24.5,
    description:
      "CBG Oil is made from the cannabigerol compound found in the cannabis plant. It's known for its therapeutic properties, providing relief from pain, inflammation, and anxiety without the psychoactive effects of THC.",
  },
  {
    id: "31",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "CBN Oil",
    rating: 4.2,
    strains: ["relaxed", "happy"],
    price: 22.5,
    description:
      "CBN Oil is made from the cannabinol compound found in the cannabis plant. It's known for its therapeutic properties, providing relief from pain and inflammation and promoting relaxation and sleep.",
  },
  {
    id: "32",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "THCV Oil",
    rating: 4.5,
    strains: ["focused", "happy"],
    price: 23.5,
    description:
      "THCV Oil is made from the tetrahydrocannabivarin compound found in the cannabis plant. It's known for its stimulating effects, providing a clear-headed, focused high that is perfect for daytime use.",
  },
  {
    id: "33",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "CBC Oil",
    rating: 4.3,
    strains: ["happy", "relaxed"],
    price: 24.5,
    description:
      "CBC Oil is made from the cannabichromene compound found in the cannabis plant. It's known for its therapeutic properties, providing relief from pain and inflammation and promoting relaxation and sleep.",
  },
  {
    id: "34",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Raw CBD Oil",
    rating: 4.7,
    strains: ["relaxed", "focused"],
    price: 25,
    description:
      "Raw CBD Oil is made from raw, unprocessed hemp extract. It contains a full spectrum of cannabinoids and other beneficial compounds found in the hemp plant, providing a potent, well-rounded effect that is perfect for therapeutic use.",
  },
  {
    id: "35",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Raw THC Oil",
    rating: 4.9,
    strains: ["euphoric", "relaxed"],
    price: 26,
    description:
      "Raw THC Oil is made from raw, unprocessed cannabis extract. It contains a full spectrum of cannabinoids and other beneficial compounds found in the cannabis plant, providing a potent, well-rounded effect that is perfect for therapeutic use.",
  },
  {
    id: "36",
    category: "oils",
    imageUrl: "product_19.jpg",
    name: "Raw Full Spectrum Oil",
    rating: 4.8,
    strains: ["relaxed", "happy"],
    price: 27,
    description:
      "Raw Full Spectrum Oil contains a wide range of cannabinoids and other beneficial compounds found in the cannabis plant, providing a potent, well-rounded effect that is perfect for therapeutic use.",
  },
];

export default products;
