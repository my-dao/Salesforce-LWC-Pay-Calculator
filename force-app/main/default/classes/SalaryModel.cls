/**
 * @description       : A model for holding salary-related data at annual scope.
 * @author            : My Dao
 * @group             : 
 * @last modified on  : 01-19-2024
 * @last modified by  : My Dao
**/
public class SalaryModel {
  @AuraEnabled
  public Decimal annualIncome { get; set; }
  @AuraEnabled
  public Decimal annualTaxableIncome { get; set; }
  @AuraEnabled
  public Decimal annualSuper { get; set; }
  @AuraEnabled
  public Decimal annualTaxes { get; set; }
  @AuraEnabled
  public Decimal annualIncomeTax { get; set; }
  @AuraEnabled
  public Decimal annualMedLevy { get; set; }
  @AuraEnabled
  public Decimal annualLIO { get; set; }
}