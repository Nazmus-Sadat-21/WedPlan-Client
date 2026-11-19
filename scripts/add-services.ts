import { createService, type NewServiceInput } from "../lib/api"

const services: NewServiceInput[] = [
  {
    vendorId: "6afcc3db1cc1f931ecc4632a",
    serviceName: "Golden Hour Wedding Photography",
    category: "Photography & Videography",
    description:
      "Full-day wedding coverage with two photographers, a cinematic highlight film, and 500+ edited photos delivered in an online gallery.",
    price: 1850,
    location: "Dhaka",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "approved",
    availability: "active",
    createdAt: new Date().toISOString(),
  },
  {
    vendorId: "6afcc3db1cc1f931ecc4632a",
    serviceName: "Rosewood Lakeside Wedding Venue",
    category: "Wedding Venues",
    description:
      "A lakeside garden venue for up to 300 guests with ceremony seating, a covered reception area, and an on-site bridal suite.",
    price: 4200,
    location: "Sylhet",
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "approved",
    availability: "active",
    createdAt: new Date().toISOString(),
  },
  {
    vendorId: "6afcc3db1cc1f931ecc4632a",
    serviceName: "Rose & Blush Floral Decoration",
    category: "Decoration & Florist",
    description:
      "Stage, aisle, and table decoration with fresh roses and seasonal flowers, including setup and teardown by our florist team.",
    price: 1200,
    location: "Dhaka",
    images: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "approved",
    availability: "active",
    createdAt: new Date().toISOString(),
  },
  {
    vendorId: "6afccd001cc1f931ecc46334",
    serviceName: "Royal Bengali Wedding Catering",
    category: "Catering Services",
    description:
      "Traditional wedding menu with kacchi biryani, roast, borhani, and dessert for 200 guests, served by a trained catering crew.",
    price: 2500,
    location: "Chattogram",
    images: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "approved",
    availability: "active",
    createdAt: new Date().toISOString(),
  },
  {
    vendorId: "6afccd001cc1f931ecc46334",
    serviceName: "Bridal Makeup & Styling Package",
    category: "Makeup & Styling",
    description:
      "Bridal makeup, hair styling, and draping with premium products, including a trial session and touch-up kit for the wedding day.",
    price: 650,
    location: "Dhaka",
    images: [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "approved",
    availability: "active",
    createdAt: new Date().toISOString(),
  },
]

for (const service of services) {
  const created = await createService(service)
  console.log(`Added: ${created.serviceName} (${created._id})`)
}
