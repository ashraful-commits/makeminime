const hexToFilter = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Simplistic implementation to determine how to express this color as a CSS filter
    const invertR = Math.round((255 - r) / 255 * 100);
    const invertG = Math.round((255 - g) / 255 * 100);
    const invertB = Math.round((255 - b) / 255 * 100);
    
    return `invert(${invertR}%) sepia(0%) saturate(100%) hue-rotate(0deg) brightness(100%) contrast(100%)`;
  };

  export default hexToFilter