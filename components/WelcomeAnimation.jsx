"use client"

import { useEffect, useRef, useState } from "react"

export default function WelcomeAnimation() {
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const textSequence = ["Welcome", "TFC", "Admin", "Team"]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [customText, setCustomText] = useState(textSequence[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % textSequence.length
        setCustomText(textSequence[nextIndex])
        return nextIndex
      })
    }, 2000) // Change text every 2 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // ASCII art for letters
    const asciiLetters = {
      A: ["  ████  ", " ██  ██ ", "████████", "██    ██", "██    ██", "██    ██"],
      B: ["███████ ", "██    ██", "███████ ", "██    ██", "██    ██", "███████ "],
      C: [" ███████", "██      ", "██      ", "██      ", "██      ", " ███████"],
      D: ["███████ ", "██    ██", "██    ██", "██    ██", "██    ██", "███████ "],
      E: ["████████", "██      ", "██████  ", "██      ", "██      ", "████████"],
      F: ["████████", "██      ", "██████  ", "██      ", "██      ", "██      "],
      G: [" ███████", "██      ", "██  ████", "██    ██", "██    ██", " ███████"],
      H: ["██    ██", "██    ██", "████████", "██    ██", "██    ██", "██    ██"],
      I: ["████████", "   ██   ", "   ██   ", "   ██   ", "   ██   ", "████████"],
      J: ["████████", "      ██", "      ██", "      ██", "██    ██", " ███████"],
      K: ["██    ██", "██  ██  ", "████    ", "██  ██  ", "██    ██", "██    ██"],
      L: ["██      ", "██      ", "██      ", "██      ", "██      ", "████████"],
      M: ["██    ██", "████████", "██ ██ ██", "██    ██", "██    ██", "██    ██"],
      N: ["██    ██", "███   ██", "██ ██ ██", "██   ███", "██    ██", "██    ██"],
      O: [" ███████", "██    ██", "██    ██", "██    ██", "██    ██", " ███████"],
      P: ["███████ ", "██    ██", "███████ ", "██      ", "██      ", "██      "],
      Q: [" ███████", "██    ██", "██    ██", "██ ██ ██", "██   ███", " ████████"],
      R: ["███████ ", "██    ██", "███████ ", "██   ██ ", "██    ██", "██    ██"],
      S: [" ███████", "██      ", " ██████ ", "      ██", "      ██", "███████ "],
      T: ["████████", "   ██   ", "   ██   ", "   ██   ", "   ██   ", "   ██   "],
      U: ["██    ██", "██    ██", "██    ██", "██    ██", "██    ██", " ███████"],
      V: ["██    ██", "██    ██", "██    ██", " ██  ██ ", "  ████  ", "   ██   "],
      W: ["██    ██", "██    ██", "██    ██", "██ ██ ██", "████████", "██    ██"],
      X: ["██    ██", " ██  ██ ", "  ████  ", "  ████  ", " ██  ██ ", "██    ██"],
      Y: ["██    ██", " ██  ██ ", "  ████  ", "   ██   ", "   ██   ", "   ██   "],
      Z: ["████████", "      ██", "    ██  ", "  ██    ", "██      ", "████████"],
      " ": ["        ", "        ", "        ", "        ", "        ", "        "],
    }

    // Create 3D-like ASCII effect
    const create3DText = (text, depth = 3) => {
      const letters = text
        .toUpperCase()
        .split("")
        .map((char) => asciiLetters[char] || asciiLetters.E)
      const lines = []

      // Create each line of the combined text
      for (let row = 0; row < 6; row++) {
        let line = ""
        letters.forEach((letter, letterIndex) => {
          line += letter[row] + "  " // Add spacing between letters
        })
        lines.push(line)
      }

      // Add 3D depth effect
      const result = []
      lines.forEach((line, lineIndex) => {
        // Main line
        result.push(line)
        // Add depth lines (shifted and with different characters)
        for (let d = 1; d <= depth; d++) {
          const depthLine = " ".repeat(d) + line.replace(/█/g, "▓").replace(/ /g, " ")
          result.push(depthLine)
        }
      })

      return result
    }

    // Create the ASCII art
    let rotation = 0
    const textLines = create3DText(customText, 2)

    // Create pre element for ASCII display
    const preElement = document.createElement("pre")
    preElement.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1;
      color: white;
      background: transparent;
      margin: 0;
      padding: 20px;
      white-space: pre;
      overflow: hidden;
      text-align: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      user-select: none;
    `

    container.appendChild(preElement)

    // Animation function
    const animate = () => {
      rotation += 0.02

      // Create rotation effect by shifting characters
      const rotatedLines = textLines.map((line, index) => {
        const shift = Math.floor(Math.sin(rotation + index * 0.1) * 3)
        const spaces = " ".repeat(Math.max(0, shift))
        return spaces + line
      })

      // Add some perspective distortion
      const perspectiveLines = rotatedLines.map((line, index) => {
        const centerIndex = Math.floor(rotatedLines.length / 2)
        const distance = Math.abs(index - centerIndex)
        const scale = 1 - distance * 0.05

        if (scale < 0.5) return " ".repeat(line.length)

        // Simple scaling by removing characters
        if (scale < 1) {
          const keepEvery = Math.floor(1 / scale)
          return line
            .split("")
            .filter((_, i) => i % keepEvery === 0)
            .join("")
        }

        return line
      })

      preElement.textContent = perspectiveLines.join("\n")

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container) return

      const fontSize = Math.max(8, Math.min(16, container.clientWidth / 80))
      preElement.style.fontSize = `${fontSize}px`
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
      if (container.contains(preElement)) {
        container.removeChild(preElement)
      }
    }
  }, [customText]) // Re-run animation when text changes

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black dark:bg-zinc-950 relative overflow-hidden"
      style={{
        fontFamily: "monospace",
      }}
    />
  )
}
