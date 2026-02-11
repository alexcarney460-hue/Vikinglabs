export type Product = {
  id: string;
  name: string;
  price: number;
  category: 'TYPE I' | 'TYPE II' | 'TYPE III' | 'BLEND' | 'ADVANCED';
  image: string;
  desc: string;
  research: string;
  slug: string;
};

export const products: Product[] = [
  {
    id: "retatrutide",
    slug: "retatrutide",
    name: "Retatrutide",
    price: 189.0,
    category: "ADVANCED",
    image: "/products/retatrutide-10ml.png",
    desc: "Triple agonist peptide targeting GLP-1, GIP, and Glucagon receptors. Studied for potent metabolic regulation.",
    research: "Current research explores efficacy in significant weight reduction and glycemic control."
  },
  {
    id: "semaglutide",
    slug: "semaglutide",
    name: "Semaglutide (5mg)",
    price: 115.0,
    category: "ADVANCED",
    image: "/products/semaglutide-10ml.png",
    desc: "GLP-1 receptor agonist. Mimics human incretin glucagon-like peptide-1 to increase insulin secretion.",
    research: "Widely researched for type 2 diabetes management and obesity treatment."
  },
  {
    id: "ghk-cu",
    slug: "ghk-cu",
    name: "GHK-Cu Copper Peptide",
    price: 49.99,
    category: "TYPE I",
    image: "/products/ghk-cu-10ml.png",
    desc: "Naturally occurring copper complex with established roles in skin regeneration and collagen synthesis.",
    research: "Primarily researched for wound healing and skin rejuvenation."
  },
  {
    id: "bpc-157",
    slug: "bpc-157",
    name: "BPC-157",
    price: 53.0,
    category: "TYPE I",
    image: "/products/bpc-157-10ml.png",
    desc: "Body Protection Compound-157 is a pentadecapeptide made of 15 amino acids. Derived from a protective protein found in the stomach.",
    research: "Studies focus on tendon-to-bone healing and damage reduction in gut tissues."
  },
  {
    id: "foxo4-dri",
    slug: "foxo4-dri",
    name: "FOXO4-DRI",
    price: 220.0,
    category: "ADVANCED",
    image: "/products/foxo4-dri-10ml.png",
    desc: "Senolytic peptide designed to disrupt p53-FOXO4 interaction, inducing apoptosis in senescent cells.",
    research: "Focused on anti-aging, rejuvenation, and clearance of senescent cells."
  }
];

