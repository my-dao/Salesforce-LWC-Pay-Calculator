# Pay Calculator Project

## Overview

The Pay Calculator project, built using Salesforce Lightning Web Components (LWC), is a tool to convert gross pay to net pay **in the Australian context for 2023-2024 Tax Year**. It takes into account critical elements like superannuation and the option for Medicare Levy exemption.

![Salary Calculator](/images/SalaryCalculator.png)

## Components

### SalaryCalculator

The SalaryCalculator Lightning Web Component allows users to input their salary details, including the base salary, superannuation rate, pay frequency, and tax year. It validates user inputs and, upon successful validation, communicates the data to the SalaryBreakdown component using the Lightning Message Service.

Features:

1. Input fields for salary, superannuation rate, and pay period.
2. Validation of user inputs with error messages.
3. Communication with SalaryBreakdown via a Lightning Message Channel.

### SalaryBreakdown

The SalaryBreakdown component subscribes to the salary data published by SalaryCalculator. It displays a detailed breakdown of the salary, calculating various elements like take-home pay, taxable income, and total taxes, using the SalaryCalculatorController Apex methods.

Features:

1. Subscription to salary data from SalaryCalculator.
2. Detailed breakdown of salary, tax calculations, and superannuation.

## Apex Classes

### SalaryCalculatorController

The SalaryCalculatorController Apex class is responsible for the backend logic of the application. It calculates the salary breakdown based on user inputs and predefined tax settings stored as custom metadata.

Functions:

1. Calculating salary for different pay periods.
2. Computing superannuation contributions and taxes.
3. Utilizing custom metadata for periodic devisors, tax and superannuation settings.

### SalaryModel

The SalaryModel Apex class serves as a data model for structuring the salary information processed by SalaryCalculatorController.

## Installation

To install this project in your Salesforce org:

1. Clone the repository using SFDX or deploy it directly through Salesforce Developer Console.
2. Ensure this project's custom metadata is deployed into your Salesforce org.

## Usage

Add the SalaryCalculator & SalaryBreakdown components to a Lightning page in your Salesforce org.

## Notes

It's important to note a few things:

1. This app is a basic demonstration/estimation, suitable for a quick overview of how we convert gross base salary offered from Employers to net take home amount. It doesn't cover complexities such as Dependant children, Student loans, Senior and Pensioner Tax Offset (SAPTO), Overtime and any other arising amount.
2. Specific to Tax Year 2023–2024: The calculations are aligned with the tax regulations of the 2023–2024 financial year. Update the logic for other tax years may be needed.
3. Rounding rules: I rounded Income Tax and Total Taxes based on this rule: Amounts under 50 cents are rounded to zero. Amounts from 50 to 99 cents are rounded to the next dollar.
4.The solution is designed in the context that in a year, there are: 260 days, 52 weeks, 26 fortnights, 12 months and in a week, there are 38 working hours. This configuration is included in custom metadata which can be easily changed based on individual needs.
