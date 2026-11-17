import { Banner } from "@/components/Home/Banner"
import { CategoriesSection } from "@/components/Home/CategoriesSection"
import { FeaturedServices } from "@/components/Home/FeaturedServices"
import { HowItWorks } from "@/components/Home/HowItWorks"
import { WhyChooseUs } from "@/components/Home/WhyChooseUs"

export default function HomePage() {
  return (
    <>
      <Banner />
      <main>
        <FeaturedServices />
        <CategoriesSection />
        <WhyChooseUs />
        <HowItWorks />
      </main>
    </>
  )
}
