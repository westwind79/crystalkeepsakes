// utils/unitConversion.js

/**
 * Constant for converting between inches and centimeters
 * Standard conversion rate: 1 inch = 2.54 centimeters
 */
const INCH_TO_CM = 2.54;

/**
 * Parses a size string to extract the name and measurement in inches
 * Example input: "Small (2")" -> { name: "Small", inches: 2 }
 * 
 * @param {string} sizeStr - Format should be "Name (X")" where X is the inch measurement
 * @returns {Object} Object containing:
 *   - name: The size name (e.g., "Small")
 *   - inches: The measurement in inches as a number, or null if no measurement found
 * 
 * Implementation details:
 * - Uses regex to parse the string: ^(.*?)\s*\((\d+)"\)$
 *   - ^(.*?) captures everything up to the measurement as the name
 *   - \s* allows for optional whitespace
 *   - \((\d+)"\) captures the number inside parentheses followed by inch symbol
 * - Returns null for inches if the string doesn't match expected format
 */
const parseSizeString = (sizeStr) => {
  const match = sizeStr.match(/^(.*?)\s*\((\d+)"\)$/);
  if (!match) return { name: sizeStr, inches: null };
  return {
    name: match[1].trim(),
    inches: parseFloat(match[2])
  };
};

/**
 * Creates an HTML structure for displaying product sizes with proper semantic markup
 * 
 * @param {string} sizeStr - The size string to parse (e.g., "Small (2")")
 * @returns {Object} Returns an object with __html property for dangerouslySetInnerHTML
 * 
 * HTML Structure Breakdown:
 * <span class="size-option">               // Container for entire size option
 *   <span class="size-option__name">       // Name portion (e.g., "Small")
 *   <span class="size-measurement">         // Container for measurements
 *     <span class="size-measurement__...">  // Individual measurement parts
 * 
 * CSS Class Naming Convention:
 * - Uses BEM methodology (Block Element Modifier)
 * - Base block: size-option
 * - Elements: name, measurement, value, unit
 * - Allows for granular styling control
 * 
 * Example output structure for "Small (2")":
 * <span class="size-option">
 *   <span class="size-option__name">Small</span>
 *   <span class="size-measurement">
 *     <span class="size-measurement__imperial">
 *       <span class="size-measurement__value">2</span>
 *       <span class="size-measurement__unit">"</span>
 *     </span>
 *     <span class="size-measurement__separator">(</span>
 *     <span class="size-measurement__metric">
 *       <span class="size-measurement__value">5.1</span>
 *       <span class="size-measurement__unit">cm</span>
 *     </span>
 *     <span class="size-measurement__separator">)</span>
 *   </span>
 * </span>
 */
export const ProductSizeComponent = (sizeStr) => {
  // Parse the size string to get name and measurement
  const { name, inches } = parseSizeString(sizeStr);
  
  // If no inch measurement found, return original string
  if (!inches) return { __html: sizeStr };
  
  // Convert inches to centimeters with one decimal place
  const cm = (inches * INCH_TO_CM).toFixed(1);
  
  // Build HTML structure with BEM class naming
  const html = `
    <span className="size-option">
      <span className="size-option__name">${name}</span>
      <span className="size-measurement">
        <span className="size-measurement__imperial">
          <span className="size-measurement__value">${inches}</span>
          <span className="size-measurement__unit">"</span>
        </span>
        <span className="size-measurement__separator">(</span>
        <span className="size-measurement__metric">
          <span className="size-measurement__value">${cm}</span>
          <span className="size-measurement__unit">cm</span>
        </span>
        <span className="size-measurement__separator">)</span>
      </span>
    </span>
  `;
  
  // Return object format required for dangerouslySetInnerHTML
  return { __html: html };
};