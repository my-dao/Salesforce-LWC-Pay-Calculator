/**
 * @description       : Calculate pay elements (Taxable income, Superranuation, Tax, LITO, Medicare Levy
 *                     and Net Take Home) in Australian 2023-2024 Tax Year based on user's input
 * @author            : My Dao
 * @group             :
 * @last modified on  : 01-19-2024
 * @last modified by  : My Dao
 **/
public class SalaryCalculatorController {
  // Retrieve time-related settings from custom metadata
  static final DECIMAL WEEKS_PER_YEAR = getSetting('Weeks_Per_Year');
  static final DECIMAL FORTNIGHTS_PER_YEAR = getSetting('Fortnights_Per_Year');
  static final DECIMAL MONTHS_PER_YEAR = getSetting('Months_Per_Year');
  static final DECIMAL WORKING_DAYS_PER_YEAR = getSetting(
    'Working_Days_Per_Year'
  );
  static final DECIMAL HOURS_PER_WEEK = getSetting('Hours_Per_Week');

  //  Retrieve Tax-related settings from custom metadata
  static final DECIMAL TAX_FREE_THRESHOLD = getSetting('Tax_Free_Threshold');

  static final DECIMAL FIRST_TAX_THRESHOLD = getSetting('First_Tax_Threshold');
  static final DECIMAL FIRST_TAX_RATE = getSetting('First_Tax_Rate');
  static final DECIMAL FIRST_MAX_TAX_AMOUNT = getSetting(
    'First_Max_Tax_Amount'
  );

  static final DECIMAL SECOND_TAX_THRESHOLD = getSetting(
    'Second_Tax_Threshold'
  );
  static final DECIMAL SECOND_TAX_RATE = getSetting('Second_Tax_Rate');
  static final DECIMAL SECOND_MAX_TAX_AMOUNT = getSetting(
    'Second_Max_Tax_Amount'
  );

  static final DECIMAL THIRD_TAX_THRESHOLD = getSetting('Third_Tax_Threshold');
  static final DECIMAL THIRD_TAX_RATE = getSetting('Third_Tax_Rate');
  static final DECIMAL THIRD_MAX_TAX_AMOUNT = getSetting(
    'Third_Max_Tax_Amount'
  );

  static final DECIMAL LAST_TAX_RATE = getSetting('Last_Tax_Rate');

  // Retrieve LITO-related settings from custom metadata
  static final DECIMAL FIRST_LITO_THRESHOLD = getSetting(
    'First_LITO_Threshold'
  );
  static final DECIMAL FIRST_MAX_LITO_AMOUNT = getSetting(
    'First_Max_LITO_Amount'
  );
  static final DECIMAL SECOND_LITO_THRESHOLD = getSetting(
    'Second_LITO_Threshold'
  );
  static final DECIMAL SECOND_LITO_DOLLAR = getSetting('Second_LITO_Dollar');
  static final DECIMAL SECOND_MAX_LITO_AMOUNT = getSetting(
    'Second_Max_LITO_Amount'
  );
  static final DECIMAL THIRD_LITO_THRESHOLD = getSetting(
    'Third_LITO_Threshold'
  );
  static final DECIMAL THIRD_LITO_DOLLAR = getSetting('Third_LITO_Dollar');

  // Retrieve Medicare Levy-related settings from custom metadata
  static final DECIMAL MED_LEVY_THRESHOLD = getSetting('Med_Levy_Threshold');
  static final DECIMAL MED_LEVY_RATE = getSetting('Med_Levy_Rate');

  // Calculate salary based on pay information from user input
  @AuraEnabled(cacheable=true)
  public static SalaryModel calculateSalary(
    Decimal inputSalary,
    String payPeriod,
    Boolean includeSuper,
    Decimal superRate,
    Boolean isMedExempt
  ) {
    Decimal annualGrossSalary = calculateAnnualGrossSalary(
      inputSalary,
      payPeriod,
      includeSuper,
      superRate
    );
    Decimal annualSuper = calculateSuperannuation(annualGrossSalary, superRate);
    Decimal annualTaxable = annualGrossSalary;
    Decimal annualMedLevy = calculateMedicareLevy(annualTaxable, isMedExempt);
    Decimal annualIncomeTax = calculateTax(annualTaxable);
    Decimal annualLIO = calculateLIO(annualTaxable);
    Decimal annualTaxes = (annualIncomeTax + annualMedLevy - annualLIO) > 0
      ? (annualIncomeTax +
          annualMedLevy -
          annualLIO)
          .round(System.RoundingMode.HALF_UP)
      : 0;
    Decimal annualIncome = annualTaxable - annualTaxes;

    SalaryModel newSal = new SalaryModel();
    newSal.annualIncome = annualIncome;
    newSal.annualTaxableIncome = annualTaxable;
    newSal.annualSuper = annualSuper;
    newSal.annualIncomeTax = annualIncomeTax;
    newSal.annualLIO = annualLIO;
    newSal.annualMedLevy = annualMedLevy;
    newSal.annualTaxes = annualTaxes;

    return newSal;
  }
  // Calculate the annual gross salary
  public static Decimal calculateAnnualGrossSalary(
    Decimal inputSalary,
    String payPeriod,
    Boolean includeSuper,
    Decimal superRate
  ) {
    Decimal annualGrossSalary;

    // Calculate the annual gross salary based on the pay period.
    if (payPeriod.equalsIgnoreCase('HOURLY')) {
      annualGrossSalary = inputSalary * WEEKS_PER_YEAR * HOURS_PER_WEEK;
    } else if (payPeriod.equalsIgnoreCase('DAILY')) {
      annualGrossSalary = inputSalary * WORKING_DAYS_PER_YEAR;
    } else if (payPeriod.equalsIgnoreCase('WEEKLY')) {
      annualGrossSalary = inputSalary * WEEKS_PER_YEAR;
    } else if (payPeriod.equalsIgnoreCase('FORTNIGHTLY')) {
      annualGrossSalary = inputSalary * FORTNIGHTS_PER_YEAR;
    } else if (payPeriod.equalsIgnoreCase('MONTHLY')) {
      annualGrossSalary = inputSalary * MONTHS_PER_YEAR;
    } else if (payPeriod.equalsIgnoreCase('ANNUALLY')) {
      annualGrossSalary = inputSalary; // No change if it's already annual
    } else {
      throw new IllegalArgumentException('Invalid Pay Period');
    }

    // Adjust for superannuation if input salary includes superannuation
    if (includeSuper) {
      annualGrossSalary = (annualGrossSalary) / (1 + superRate / 100);
    }
    return annualGrossSalary;
  }

  // Calculate the superannuation contribution
  public static Decimal calculateSuperannuation(
    Decimal annualGrossSalary,
    Decimal superRate
  ) {
    return annualGrossSalary * (superRate / 100);
  }

  // Calculate the tax amount based on Australian tax brackets
  public static Decimal calculateTax(Decimal taxableIncome) {
    Decimal tax = 0;

    if (taxableIncome <= TAX_FREE_THRESHOLD) {
      tax = 0;
    } else if (taxableIncome <= FIRST_TAX_THRESHOLD) {
      tax = (taxableIncome - TAX_FREE_THRESHOLD) * FIRST_TAX_RATE;
    } else if (taxableIncome <= SECOND_TAX_THRESHOLD) {
      tax =
        FIRST_MAX_TAX_AMOUNT +
        (taxableIncome - FIRST_TAX_THRESHOLD) * SECOND_TAX_RATE;
    } else if (taxableIncome <= THIRD_TAX_THRESHOLD) {
      tax =
        SECOND_MAX_TAX_AMOUNT +
        (taxableIncome - SECOND_TAX_THRESHOLD) * THIRD_TAX_RATE;
    } else {
      tax =
        THIRD_MAX_TAX_AMOUNT +
        (taxableIncome - THIRD_TAX_THRESHOLD) * LAST_TAX_RATE;
    }

    // Round the calculated tax
    return tax.round(System.RoundingMode.HALF_UP);
  }

  // Calculate the LITO (LOW INCOME TAX OFFSET) amount
  public static Decimal calculateLIO(Decimal taxableIncome) {
    Decimal lito = 0;

    if (taxableIncome <= FIRST_LITO_THRESHOLD) {
      lito = FIRST_MAX_LITO_AMOUNT;
    } else if (
      taxableIncome > FIRST_LITO_THRESHOLD &&
      taxableIncome <= SECOND_LITO_THRESHOLD
    ) {
      lito =
        FIRST_MAX_LITO_AMOUNT -
        (SECOND_LITO_DOLLAR * (taxableIncome - FIRST_LITO_THRESHOLD));
    } else if (
      taxableIncome > SECOND_LITO_THRESHOLD &&
      taxableIncome <= THIRD_LITO_THRESHOLD
    ) {
      lito =
        SECOND_MAX_LITO_AMOUNT -
        (THIRD_LITO_DOLLAR * (taxableIncome - SECOND_LITO_THRESHOLD));
    }
    return lito;
  }

  // Calculate Medicare Levy
  public static Decimal calculateMedicareLevy(
    Decimal taxableIncome,
    Boolean isMedExempt
  ) {
    Decimal medLevy = 0;

    if (isMedExempt == false) {
      if (taxableIncome >= MED_LEVY_THRESHOLD) {
        medLevy = taxableIncome * MED_LEVY_RATE;
      } else {
        medLevy = 0;
      }
    }
    return medLevy;
  }
  
  // Retrieve salary elements from custom metadata
  public static Decimal getSetting(String recordName) {
    Pay_Calculator_Setting__mdt record = Pay_Calculator_Setting__mdt.getInstance(
      recordName
    );
    return record.Value__c == null ? 0 : record.Value__c;
  }

  // Retrieve Periodic Divisors to convert from annual figures to monthly, fortnightly and weekly
  @AuraEnabled(cacheable=true)
  public static Map<String, Decimal> getPeriodicDivisors() {
    Map<String, Decimal> PeriodicDivisors = new Map<String, Decimal>();
    PeriodicDivisors.put('Months Per Year', MONTHS_PER_YEAR);
    PeriodicDivisors.put('Weeks Per Year', WEEKS_PER_YEAR);
    PeriodicDivisors.put('Fortnights Per Year', FORTNIGHTS_PER_YEAR);
    return PeriodicDivisors;
  }
}