const hexToRgb =(hex: string)=> {
    // Remove the '#' if it's there
    hex = hex.replace('#', '');
    
    // Parse RGB values from the hex code
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // Return an object with RGB values
    return { r, g, b };
  }

  export default hexToRgb