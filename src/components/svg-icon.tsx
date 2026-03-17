"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface SvgIconProps {
  src: string
  alt?: string
  width?: number
  height?: number
  className?: string
}

// Cache for SVG content to avoid repeated fetches (keyed by src + dimensions)
const svgCache = new Map<string, string>()

export function SvgIcon({ src, alt, width = 16, height = 16, className }: SvgIconProps) {
  const cacheKey = `${src}-${width}-${height}`
  const [svgContent, setSvgContent] = useState<string | null>(svgCache.get(cacheKey) || null)

  useEffect(() => {
    if (svgCache.has(cacheKey)) {
      setSvgContent(svgCache.get(cacheKey)!)
      return
    }

    fetch(src)
      .then(response => response.text())
      .then(text => {
        // Replace width and height attributes
        let processedSvg = text
          .replace(/width="[^"]*"/, `width="${width}"`)
          .replace(/height="[^"]*"/, `height="${height}"`)
        
        // If width/height weren't replaced, add them
        if (!processedSvg.includes(`width="${width}"`)) {
          processedSvg = processedSvg.replace('<svg', `<svg width="${width}"`)
        }
        if (!processedSvg.includes(`height="${height}"`)) {
          processedSvg = processedSvg.replace('<svg', `<svg height="${height}"`)
        }
        
        // Replace hardcoded colors with currentColor for proper theming
        processedSvg = processedSvg
          .replace(/stroke="black"/g, 'stroke="currentColor"')
          .replace(/stroke="#000000"/g, 'stroke="currentColor"')
          .replace(/stroke="#000"/g, 'stroke="currentColor"')
          .replace(/fill="black"/g, 'fill="currentColor"')
          .replace(/fill="#000000"/g, 'fill="currentColor"')
          .replace(/fill="#000"/g, 'fill="currentColor"')

        svgCache.set(cacheKey, processedSvg)
        setSvgContent(processedSvg)
      })
      .catch(console.error)
  }, [src, cacheKey, width, height])

  if (!svgContent) {
    // Return placeholder with same dimensions while loading
    return (
      <span 
        className={cn("inline-block shrink-0", className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    )
  }

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width, height }}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}

