import { LightningElement, wire, track } from "lwc";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import SALARY_DATA_CHANNEL from "@salesforce/messageChannel/SalaryDataMessageChannel__c";
import calculateSalary from "@salesforce/apex/SalaryCalculatorController.calculateSalary";
import getPeriodicDivisors from "@salesforce/apex/SalaryCalculatorController.getPeriodicDivisors";

export default class SalaryBreakDown extends LightningElement {
  annualTakeHome = 0;
  weeklyTakeHome = 0;
  fortnightlyTakeHome = 0;
  annualTaxableIncome = 0;
  annualSuperannuation = 0;
  annualTotalTaxes = 0;
  annualIncomeTax = 0;
  annualMedLevy = 0;
  annualLIO = 0;
  subscription = 0;
  errorMessage = "";
  isMedExempt = false;
  weeksPerYear;
  fortnightsPerYear;
  monthsPerYear;

  @track salaryData = {
    "Take home pay": {},
    "Taxable income": {},
    "Superannuation": {},
    "Total taxes": {},
    "Income Tax": {},
    "LITO (Low Income Tax Offset)": {},
    "Medicare Levy": {}
  };

  @wire(MessageContext) messageContext;

  // Get salary data when the component is inserted into the DOM.
  connectedCallback() {
    this.getSalaryData();
  }
  // Unsubscribe when the component is disconnected
  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }
  /// Subscribe to SALARY_DATA_CHANNEL message to get salary data
  getSalaryData() {
    if (!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        SALARY_DATA_CHANNEL,
        (message) => this.handleMessage(message)
      );
    }
  }

  // Handler for processing received message data.
  handleMessage(message) {
    // Extract the salary, payPeriod, superRate, and isMedExempt from the message
    const { salary, payPeriod, superRate, includeSuper, isMedExempt } = message;
    // Convert payPeriod to enum value accepted by Apex
    let payPeriodEnum = this.convertToEnum(payPeriod);

    // Calculate and set annual salary breakdowns
    this.calculateAnnualTakeHome(
      salary,
      payPeriodEnum,
      includeSuper,
      superRate,
      isMedExempt
    );
  }
  calculateAnnualTakeHome(
    salary,
    payPeriod,
    includeSuper,
    superRate,
    isMedExempt
  ) {
    calculateSalary({
      inputSalary: salary,
      payPeriod: payPeriod,
      includeSuper: includeSuper,
      superRate: superRate,
      isMedExempt: isMedExempt
    })
      .then((result) => {
        this.annualTakeHome = parseFloat(result.annualIncome);
        this.annualTaxableIncome = parseFloat(result.annualTaxableIncome);
        this.annualSuperannuation = parseFloat(result.annualSuper);
        this.annualTotalTaxes = parseFloat(result.annualTaxes);
        this.annualIncomeTax = parseFloat(result.annualIncomeTax);
        this.annualMedLevy = parseFloat(result.annualMedLevy);
        this.annualLIO = parseFloat(result.annualLIO);
      })
      .catch((error) => {
        this.handleError(error);
      });
  }

  // Wire getPeriodicDivisors method to retrieve number of weeks, fortnights and months in a year
  @wire(getPeriodicDivisors)
  wiredDivisors({ error, data }) {
    if (data) {
      this.monthsPerYear = data["Months Per Year"];
      this.weeksPerYear = data["Weeks Per Year"];
      this.fortnightsPerYear = data["Fortnights Per Year"];
    } else if (error) {
      console.error("Error retrieving divisors:", error);
    }
  }

  convertToEnum(payPeriod) {
    return payPeriod.toUpperCase();
  }

  handleError(error) {
    let message = "Unknown error";
    if (Array.isArray(error.body)) {
      message = error.body.map((e) => e.message).join(", ");
    } else if (typeof error.body.message === "string") {
      message = error.body.message;
    }
    this.showError(message);
  }

  showError(error) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: error,
        variant: "error"
      })
    );
  }

  formatNumber(value) {
    let formattedValue = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formattedValue;
  }
  // Get income data to show in the UI
  get incomeData() {
    return [
      {
        label: "Take home pay",
        weekly: this.formatNumber(this.annualTakeHome / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualTakeHome / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(this.annualTakeHome / this.monthsPerYear),
        annual: this.formatNumber(this.annualTakeHome)
      },
      {
        label: "Taxable income",
        weekly: this.formatNumber(this.annualTaxableIncome / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualTaxableIncome / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(
          this.annualTaxableIncome / this.monthsPerYear
        ),
        annual: this.formatNumber(this.annualTaxableIncome)
      },
      {
        label: "Superannuation",
        weekly: this.formatNumber(
          this.annualSuperannuation / this.weeksPerYear
        ),
        fortnightly: this.formatNumber(
          this.annualSuperannuation / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(
          this.annualSuperannuation / this.monthsPerYear
        ),
        annual: this.formatNumber(this.annualSuperannuation)
      },
      {
        label: "Total taxes",
        weekly: this.formatNumber(this.annualTotalTaxes / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualTotalTaxes / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(this.annualTotalTaxes / this.monthsPerYear),
        annual: this.formatNumber(this.annualTotalTaxes)
      }
    ];
  }

  // Get tax data to show in the UI
  get taxData() {
    return [
      {
        label: "Income Tax",
        weekly: this.formatNumber(this.annualIncomeTax / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualIncomeTax / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(this.annualIncomeTax / this.monthsPerYear),
        annual: this.formatNumber(this.annualIncomeTax)
      },
      {
        label: "LITO (Low Income Tax Offset)",
        weekly: -this.formatNumber(this.annualLIO / this.weeksPerYear),
        fortnightly: -this.formatNumber(
          this.annualLIO / this.fortnightsPerYear
        ),
        monthly: -this.formatNumber(this.annualLIO / this.monthsPerYear),
        annual: -this.formatNumber(this.annualLIO)
      },
      {
        label: "Medicare Levy",
        weekly: this.formatNumber(this.annualMedLevy / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualMedLevy / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(this.annualMedLevy / this.monthsPerYear),
        annual: this.formatNumber(this.annualMedLevy)
      },
      {
        label: "Total taxes",
        weekly: this.formatNumber(this.annualTotalTaxes / this.weeksPerYear),
        fortnightly: this.formatNumber(
          this.annualTotalTaxes / this.fortnightsPerYear
        ),
        monthly: this.formatNumber(this.annualTotalTaxes / this.monthsPerYear),
        annual: this.formatNumber(this.annualTotalTaxes)
      }
    ];
  }
}