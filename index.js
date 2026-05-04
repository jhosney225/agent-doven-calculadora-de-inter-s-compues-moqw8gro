
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Tool definitions for compound interest calculations
const tools = [
  {
    name: "calculate_compound_interest",
    description:
      "Calculates compound interest for an investment. Returns the final amount and interest earned.",
    input_schema: {
      type: "object",
      properties: {
        principal: {
          type: "number",
          description: "Initial investment amount in currency units",
        },
        annual_rate: {
          type: "number",
          description: "Annual interest rate as a percentage (e.g., 5 for 5%)",
        },
        years: {
          type: "number",
          description: "Number of years for the investment",
        },
        compounds_per_year: {
          type: "integer",
          description:
            "Number of times interest compounds per year (1=annual, 2=semi-annual, 4=quarterly, 12=monthly, 365=daily)",
          default: 12,
        },
      },
      required: ["principal", "annual_rate", "years"],
    },
  },
  {
    name: "calculate_investment_schedule",
    description:
      "Creates a detailed year-by-year or month-by-month schedule of investment growth with compound interest.",
    input_schema: {
      type: "object",
      properties: {
        principal: {
          type: "number",
          description: "Initial investment amount",
        },
        annual_rate: {
          type: "number",
          description: "Annual interest rate as a percentage",
        },
        years: {
          type: "number",
          description: "Total investment period in years",
        },
        compounds_per_year: {
          type: "integer",
          description: "Compounding frequency per year",
          default: 12,
        },
        schedule_type: {
          type: "string",
          enum: ["yearly", "monthly"],
          description: "Type of schedule to generate",
          default: "yearly",
        },
      },
      required: ["principal", "annual_rate", "years"],
    },
  },
  {
    name: "compare_investments",
    description:
      "Compares multiple investment scenarios with different rates or compounding frequencies.",
    input_schema: {
      type: "object",
      properties: {
        principal: {
          type: "number",
          description: "Initial investment amount",
        },
        years: {
          type: "number",
          description: "Investment period in years",
        },
        scenarios: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the investment scenario",
              },
              annual_rate: {
                type: "number",
                description: "Annual interest rate as a percentage",
              },
              compounds_per_year: {
                type: "integer",
                description: "Compounding frequency per year",
                default: 12,
              },
            },
            required: ["name", "annual_rate"],
          },
          description: "Array of investment scenarios to compare",
        },
      },
      required: ["principal", "years", "scenarios"],
    },
  },
];

// Tool implementation functions
function calculateCompoundInterest(principal, annualRate, years, compoundsPerYear = 12) {
  const rate = annualRate / 100;
  const finalAmount = principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years);
  const interestEarned = finalAmount - principal;

  return {
    principal: parseFloat(principal.toFixed(2)),
    annual_rate: annualRate,
    years: years,
    compounds_per_year: compoundsPerYear,
    final_amount: parseFloat(finalAmount.toFixed(2)),
    interest_earned: parseFloat(interestEarned.toFixed(2)),
    total_return_percentage: parseFloat(((interestEarned / principal) * 100).toFixed(2)),
  };
}

function calculateInvestmentSchedule(principal, annualRate, years, compoundsPerYear = 12, scheduleType = "yearly") {
  const rate = annualRate / 100;
  const schedule = [];

  if (scheduleType === "yearly") {
    for (let year = 1; year <= years; year++) {
      const amount = principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * year);
      schedule.push({
        year: year,
        amount: parseFloat(amount.toFixed(2)),
        interest_earned: parseFloat((amount - principal).toFixed(2)),
      });
    }
  } else {
    // Monthly schedule
    for (let month = 1; month <= years * 12; month++) {
      const amount = principal * Math.pow(1 + rate / compoundsPerYear, (compoundsPerYear * month) / 12);
      schedule.push({
        month: month,
        year: Math.ceil(month / 12),
        amount: parseFloat(amount.toFixed(2)),
        interest_earned: parseFloat((amount - principal).toFixed(2)),
      });
    }
  }

  return {
    principal: parseFloat(principal.toFixed(2)),
    annual_rate: annualRate,
    compounds_per_year: compoundsPerYear,
    schedule_type: scheduleType,
    schedule: schedule,
  };
}

function compareInvestments(principal, years, scenarios) {
  const results = [];

  for (const scenario of scenarios) {
    const result = calculateCompoundInterest(principal, scenario.annual_rate, years, scenario.compounds_per