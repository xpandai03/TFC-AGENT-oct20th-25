"use client"

import { Warp } from "@paper-design/shaders-react"

export default function WarpBackground() {
  return (
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
        colors={[
          "hsl(210, 100%, 20%)", // Deep blue
          "hsl(200, 100%, 75%)", // Light cyan
          "hsl(220, 90%, 30%)",  // Dark blue
          "hsl(190, 100%, 80%)"  // Very light cyan
        ]}
      />
    </div>
  )
}
