import { ProductProps } from "../components/types";

const products: ProductProps[] = [
  {
    id: "1",
    imageUrl: "product_1.png",
    name: "Blue Dream",
    grams: 3.5,
    rating: 4.5,
    strains: ["sleepy", "happy"],
    price: 0.02,
    description:
      "Blue Dream is a sativa-dominant hybrid marijuana strain made by crossing Blueberry with Haze. Blue Dream produces a balancing high accompanied by full-body relaxation with gentle cerebral invigoration. Novice and veteran consumers alike enjoy the calming and euphoric effects that Blue Dream provides. Consumers also love the flavor - which smells and tastes just like sweet berries. Medical marijuana patients say Blue Dream delivers swift relief from symptoms associated with pain, depression, and nausea.",
  },
  {
    id: "2",
    imageUrl: "product_2.png",
    name: "Girl Scout Cookies",
    grams: 3.5,
    rating: 4.0,
    strains: ["hungry", "euphoric"],
    price: 0.01,
    description:
      "The Girl Scout Cookies strain is classified as a hybrid, with a 60% indica and 40% sativa genetic makeup. Its lineage hails from the mega-popular strains Durban Poison (a sativa) and OG Kush (a hybrid). The GSC buds grown and sent into labs for testing have shown results of a 17-28% THC content (rather high for a smoking strain), and a CBD content of 0.09-0.2% (low in CBD).",
  },
  {
    id: "3",
    imageUrl: "product_3.png",
    name: "OG Kush",
    grams: 3.5,
    rating: 5.0,
    strains: ["relaxed", "uplifted"],
    price: 0.03,
    description:
      "OG Kush was first cultivated in Florida, in the early ‘90s when a strain from Northern California was crossed with a Hindu Kush plant from Amsterdam. The result was a hybrid with a unique terpene profile that boasts a complex aroma with notes of fuel, skunk, and spice. The genetic backbone of West Coast cannabis varieties, OG Kush arrived in Los Angeles in 1996 when Matt “Bubba” Berger brought it (along with “The Bubba,” which was later used to create the famed Bubba Kush) from Florida to legendary cultivator Josh D. Since then, OG Kush has become a worldwide staple used to create numerous famous strains like GSC and Headband.",
  },
  {
    id: "4",
    imageUrl: "product_4.png",
    name: "Sour Diesel",
    grams: 3.5,
    rating: 3,
    strains: ["creative", "focused"],
    price: 0.02,
    description:
      "Sour Diesel, sometimes called Sour D, is an invigorating sativa-dominant strain named after its pungent, diesel-like aroma. This fast-acting strain delivers energizing, dreamy cerebral effects that have pushed Sour Diesel to its legendary status. Stress, pain, and depression fade away in long-lasting relief that makes Sour Diesel a top choice among medical patients. This strain took root in the early '90s, and it is believed to have descended from Chemdog 91 and Super Skunk.",
  },
  {
    id: "5",
    imageUrl: "product_5.png",
    name: "Cheese Quake",
    grams: 3.5,
    rating: 5,
    strains: ["energetic", "talkative"],
    price: 0.04,
    description:
      "Cheese Quake by TGA Subcool Seeds is a 60/40 indica-dominant cross between Cheese and Querkle. A hint of grape is detectable, but its aroma is led by the funky sour aroma commonly associated with Cheese hybrids. Expect to feel tingy invigoration followed by uplifting body sensations to help you feel relaxed and carefree.",
  },
  {
    id: "6",
    imageUrl: "product_6.png",
    name: "Pineapple Express",
    grams: 3.5,
    rating: 3.5,
    strains: ["tingly", "aroused"],
    price: 0.02,
    description:
      "Pineapple Express combines the potent and flavorful forces of parent strains Trainwreck and Hawaiian. The smell is likened to fresh apple and mango, with a taste of pineapple, pine, and cedar. This hard-hitting sativa-dominant hybrid provides a long-lasting energetic buzz perfect for productive afternoons and creative escapes.",
  },
  // Add more products as needed
];

export default products;
