import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import SALARY_DATA_CHANNEL from "@salesforce/messageChannel/SalaryDataMessageChannel__c";
export default class SalaryCalculator extends LightningElement {
  salary = 0;
  payPeriod = "Annually";
  errorMessage = "";
  taxYear = "2023 - 2024";
  superRate = 11;
  includeSuper = false;
  isMedExempt = false;

  get timePeriodOptions() {
    return [
      { label: "Annually", value: "Annually" },
      { label: "Monthly", value: "Monthly" },
      { label: "Fortnightly", value: "Fortnightly" },
      { label: "Weekly", value: "Weekly" },
      { label: "Daily", value: "Daily" },
      { label: "Hourly", value: "Hourly" }
    ];
  }

  get taxYearOptions() {
    return [
      { label: "2023 - 2024", value: "2023 - 2024" },
      { label: "2024 - 2025", value: "2024 - 2025" },
      { label: "2025 - 2026", value: "2025 - 2026" }
    ];
  }

  get salaryFormatted() {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(this.salary);
  }

  // Handle salary change & validate input
  handleSalaryChange(event) {
    const salaryInput = event.target.value;
    if (!isNaN(parseFloat(salaryInput)) && isFinite(salaryInput)) {
      this.salary = parseFloat(salaryInput);
    } else {
      // Set to null to trigger error in handleButtonClick
      this.salary = null;
    }
  }

  handlePeriodChange(event) {
    this.payPeriod = event.target.value;
  }

  // Handle superannuation rate change & validate input
  handleSuperRateChange(event) {
    const superRateInput = event.target.value;
    if (!isNaN(parseFloat(superRateInput)) && isFinite(superRateInput)) {
      this.superRate = parseFloat(superRateInput);
    } else {
      // Set to null to trigger error in handleButtonClick
      this.superRate = null;
    }
  }

  handleIncludeSuperChange(event) {
    this.includeSuper = event.target.checked;
  }

  handleMedicareExemptionChange(event) {
    this.isMedExempt = event.target.checked;
  }

  // Publish event message to so that SalaryBreakDown Component can subscribe
  @wire(MessageContext) messageContext;
  handleButtonClick() {
  const error = this.validateInputs();
  if (error) {
    this.showError(error);
    return;
  }
    const message = {
      salary: this.salary,
      payPeriod: this.payPeriod,
      superRate: this.superRate,
      includeSuper: this.includeSuper,
      isMedExempt: this.isMedExempt
    };
    publish(this.messageContext, SALARY_DATA_CHANNEL, message);
  }

  // Validate inputs and return error message if any
  validateInputs() {
    if (this.salary === null && this.superRate === null) {
      return "Please enter valid salary and superannuation rate with number format";
    } else if (this.salary === null || this.salary === 0) {
      return "Please enter valid salary with number format";
    } else if (this.superRate === null) {
      return "Please enter valid superannuation rate with number format";
    }
    return null; 
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
  get hasError() {
    return this.errorMessage !== "";
  }
}