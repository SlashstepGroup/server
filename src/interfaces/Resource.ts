export default interface Resource<ScopeData> {

  id: string;

  /**
   * 
   */
  getAccessPolicyScopeData(): Promise<ScopeData>;

}