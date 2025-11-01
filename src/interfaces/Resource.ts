export default interface Resource<ScopeData> {

  id: string;

  /**
   * 
   */
  getScopeData(): ScopeData | Promise<ScopeData>;

}