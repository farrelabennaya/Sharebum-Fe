import React, { useState } from "react";

export default function GalleryGrid({ items = [], onOpen }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
   <div className="grid grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((a, i) => (
        <div
          key={a.id}
          className="group relative overflow-hidden rounded-2xl border-0 cursor-pointer transform transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-2 h-28 lg:h-56 bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-2xl"
          onClick={() => onOpen?.(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          title={a.caption || ""}
          style={{
            transitionDelay: `${i * 50}ms`
          }}
        >
          {/* Image */}
          <img
            src={a.variants?.md || a.url}
            alt={a.caption || ""}
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Caption overlay */}
          {a.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-2">
                {a.caption}
              </p>
            </div>
          )}
          
          {/* Hover indicator */}
          {/* <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200 delay-100">
            <svg 
              className="w-4 h-4 text-gray-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          </div> */}
          
          {/* Subtle border glow */}
          <div className="absolute inset-0 rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Loading state shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
      ))}
    </div>
  );
}