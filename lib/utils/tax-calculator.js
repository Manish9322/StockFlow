/**
 * Tax Calculation Utilities
 * Used to calculate taxes for purchases based on tax configuration
 */

/**
 * Calculate tax amount based on configuration
 * @param {number} subtotal - The subtotal amount before taxes
 * @param {Object} taxConfig - The tax configuration object
 * @returns {Object} Object containing tax breakdown and total
 */
export function calculateTaxes(subtotal, taxConfig) {
  if (!taxConfig || subtotal <= 0) {
    return {
      subtotal,
      gst: 0,
      platformFee: 0,
      otherTaxes: [],
      totalTax: 0,
      grandTotal: subtotal,
    };
  }

  let gstAmount = 0;
  let platformFeeAmount = 0;
  const otherTaxesBreakdown = [];
  let runningTotal = subtotal;

  // Calculate GST
  if (taxConfig.gst?.enabled) {
    if (taxConfig.gst.type === "inclusive") {
      // GST is already included in the price
      // Calculate the GST portion: GST = (Price × Rate) / (100 + Rate)
      gstAmount = (subtotal * taxConfig.gst.rate) / (100 + taxConfig.gst.rate);
    } else {
      // GST is exclusive, add to the price
      gstAmount = (subtotal * taxConfig.gst.rate) / 100;
      runningTotal += gstAmount;
    }
  }

  // Calculate Platform Fee
  if (taxConfig.platformFee?.enabled) {
    if (taxConfig.platformFee.type === "percentage") {
      platformFeeAmount = (subtotal * taxConfig.platformFee.rate) / 100;
    } else {
      // Fixed amount
      platformFeeAmount = taxConfig.platformFee.rate;
    }
    runningTotal += platformFeeAmount;
  }

  // Calculate Other Taxes
  if (taxConfig.otherTaxes && Array.isArray(taxConfig.otherTaxes)) {
    taxConfig.otherTaxes.forEach((tax) => {
      if (tax.enabled) {
        let taxAmount = 0;
        if (tax.type === "percentage") {
          taxAmount = (subtotal * tax.rate) / 100;
        } else {
          // Fixed amount
          taxAmount = tax.rate;
        }
        otherTaxesBreakdown.push({
          name: tax.name,
          rate: tax.rate,
          type: tax.type,
          amount: taxAmount,
        });
        runningTotal += taxAmount;
      }
    });
  }

  const totalTax = gstAmount + platformFeeAmount + otherTaxesBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    subtotal,
    gst: gstAmount,
    platformFee: platformFeeAmount,
    otherTaxes: otherTaxesBreakdown,
    totalTax,
    grandTotal: runningTotal,
  };
}

/**
 * Format tax breakdown for display
 * @param {Object} taxCalculation - Result from calculateTaxes
 * @param {string} currency - Currency symbol or code
 * @returns {Array} Array of formatted tax line items
 */
export function formatTaxBreakdown(taxCalculation, currency = "$") {
  const breakdown = [];

  breakdown.push({
    label: "Subtotal",
    amount: taxCalculation.subtotal,
    formatted: `${currency}${taxCalculation.subtotal.toFixed(2)}`,
  });

  if (taxCalculation.gst > 0) {
    breakdown.push({
      label: "GST",
      amount: taxCalculation.gst,
      formatted: `${currency}${taxCalculation.gst.toFixed(2)}`,
    });
  }

  if (taxCalculation.platformFee > 0) {
    breakdown.push({
      label: "Platform Fee",
      amount: taxCalculation.platformFee,
      formatted: `${currency}${taxCalculation.platformFee.toFixed(2)}`,
    });
  }

  taxCalculation.otherTaxes.forEach((tax) => {
    breakdown.push({
      label: tax.name,
      amount: tax.amount,
      formatted: `${currency}${tax.amount.toFixed(2)}`,
      details: `${tax.rate}${tax.type === "percentage" ? "%" : ` ${currency}`}`,
    });
  });

  if (taxCalculation.totalTax > 0) {
    breakdown.push({
      label: "Total Tax",
      amount: taxCalculation.totalTax,
      formatted: `${currency}${taxCalculation.totalTax.toFixed(2)}`,
      isTotalTax: true,
    });
  }

  breakdown.push({
    label: "Grand Total",
    amount: taxCalculation.grandTotal,
    formatted: `${currency}${taxCalculation.grandTotal.toFixed(2)}`,
    isGrandTotal: true,
  });

  return breakdown;
}

/**
 * Get tax summary text for receipts/invoices
 * @param {Object} taxCalculation - Result from calculateTaxes
 * @returns {string} Summary text
 */
export function getTaxSummary(taxCalculation) {
  const parts = [];
  
  if (taxCalculation.gst > 0) {
    parts.push(`GST: ${taxCalculation.gst.toFixed(2)}`);
  }
  
  if (taxCalculation.platformFee > 0) {
    parts.push(`Platform Fee: ${taxCalculation.platformFee.toFixed(2)}`);
  }
  
  if (taxCalculation.otherTaxes.length > 0) {
    taxCalculation.otherTaxes.forEach((tax) => {
      parts.push(`${tax.name}: ${tax.amount.toFixed(2)}`);
    });
  }
  
  if (parts.length === 0) {
    return "No taxes applied";
  }
  
  return parts.join(", ");
}

/**
 * Validate tax configuration
 * @param {Object} taxConfig - The tax configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTaxConfig(taxConfig) {
  const errors = [];

  if (!taxConfig) {
    return { isValid: false, errors: ["Tax configuration is required"] };
  }

  // Validate GST
  if (taxConfig.gst?.enabled) {
    if (taxConfig.gst.rate < 0 || taxConfig.gst.rate > 100) {
      errors.push("GST rate must be between 0 and 100");
    }
    if (!["inclusive", "exclusive"].includes(taxConfig.gst.type)) {
      errors.push("GST type must be either 'inclusive' or 'exclusive'");
    }
  }

  // Validate Platform Fee
  if (taxConfig.platformFee?.enabled) {
    if (taxConfig.platformFee.rate < 0) {
      errors.push("Platform fee rate cannot be negative");
    }
    if (!["percentage", "fixed"].includes(taxConfig.platformFee.type)) {
      errors.push("Platform fee type must be either 'percentage' or 'fixed'");
    }
  }

  // Validate Other Taxes
  if (taxConfig.otherTaxes && Array.isArray(taxConfig.otherTaxes)) {
    taxConfig.otherTaxes.forEach((tax, index) => {
      if (!tax.name || tax.name.trim() === "") {
        errors.push(`Tax #${index + 1}: Name is required`);
      }
      if (tax.rate < 0) {
        errors.push(`Tax #${index + 1}: Rate cannot be negative`);
      }
      if (!["percentage", "fixed"].includes(tax.type)) {
        errors.push(`Tax #${index + 1}: Type must be either 'percentage' or 'fixed'`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
