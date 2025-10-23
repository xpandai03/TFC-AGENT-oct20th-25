import { Warp } from "@paper-design/shaders-react"
import Image from "next/image"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background shader */}
      <div className="absolute inset-0">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={10}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={1}
          colors={["hsl(210, 100%, 20%)", "hsl(200, 100%, 75%)", "hsl(220, 90%, 30%)", "hsl(190, 100%, 80%)"]}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-start justify-center px-8 pt-16 md:pt-24">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <Image
              src="/images/logo-white.png"
              alt="Logo"
              width={400}
              height={150}
              className="w-auto h-24 md:h-32"
              priority
            />
          </div>

          {/* Email input with submit button */}
          <div className="relative"></div>

          {/* Description text */}
        </div>
      </div>
    </main>
  )
}
