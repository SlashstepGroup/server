export default interface Resource<ScopeData> {

  id: string;

  resourceType: string;

  /**
   * 
   */
  getScopeData(): ScopeData | Promise<ScopeData>;

}