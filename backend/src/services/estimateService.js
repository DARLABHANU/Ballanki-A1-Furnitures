/**
 * Centralized service for calculating manufacturing and delivery estimates.
 * All calculations use calendar days (including weekends and holidays).
 */

/**
 * Calculates the calendar date after adding the specified number of days
 * @param {Date|string|number} startDate The date to start from
 * @param {number} days The number of calendar days to add
 * @returns {Date} The resulting date
 */
function addCalendarDays(startDate, days) {
    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid start date');
    }
    date.setDate(date.getDate() + Number(days));
    return date;
}

/**
 * Calculates the estimate snapshot for a given product or configuration.
 *
 * @param {Object} config The estimation configuration for the product
 * @param {number} config.manufacturing_duration_days
 * @param {number} [config.preparation_duration_days=0]
 * @param {number} [config.quality_check_duration_days=0]
 * @param {number} [config.packing_duration_days=0]
 * @param {number} [config.shipping_duration_days=0]
 * @param {Date|null} [productionStartDate=null] The scheduled start date. If null, calculations are provisional based on today.
 * @returns {Object} The generated estimate snapshot
 */
function calculateProductEstimate(config, productionStartDate = null) {
    const {
        manufacturing_duration_days = 0,
        preparation_duration_days = 0,
        quality_check_duration_days = 0,
        packing_duration_days = 0,
        shipping_duration_days = 0
    } = config;

    const totalManufacturingDays =
        Number(preparation_duration_days) +
        Number(manufacturing_duration_days) +
        Number(quality_check_duration_days);

    const isConfirmed = !!productionStartDate;
    const baseDate = isConfirmed ? new Date(productionStartDate) : new Date();

    const completionDate = addCalendarDays(baseDate, totalManufacturingDays);

    const dispatchDate = addCalendarDays(completionDate, Number(packing_duration_days));
    const deliveryDate = addCalendarDays(dispatchDate, Number(shipping_duration_days));

    return {
        duration_days: totalManufacturingDays,
        duration_unit: 'CALENDAR_DAYS',
        production_start_date: isConfirmed ? baseDate : null,
        estimated_completion_date: completionDate,
        packing_duration_days: Number(packing_duration_days),
        estimated_dispatch_date: dispatchDate,
        shipping_duration_days: Number(shipping_duration_days),
        estimated_delivery_date: deliveryDate,
        timezone: 'Asia/Kolkata', // Configurable if needed
        is_provisional: !isConfirmed,
        created_at: new Date()
    };
}

module.exports = {
    addCalendarDays,
    calculateProductEstimate
};
