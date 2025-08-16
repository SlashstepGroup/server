// type AndLogicalOperatorObject = {
//   $and?: ConditionObject[];
// }

// type OrLogicalOperatorObject = {
//   $or?: ConditionObject[];
// }

// type NotLogicalOperatorObject = {
//   $not?: ConditionObject;
// }

// type LogicalOperatorObject = AndLogicalOperatorObject | OrLogicalOperatorObject | NotLogicalOperatorObject;

// type FieldObject = {
//   [field: string]: string | number | boolean | RegExp;
// }

// type ConditionObject = FieldObject | LogicalOperatorObject;

// export default class GazeQLQueryBuilder {

//   constructor() {

//   }

//   static build(object: LogicalOperatorObject | FieldObject): string {

//     let query = "";

//     const isUsingAtomicOperator = "$and" in object || "$or" in object || "$not" in object;
//     if (isUsingAtomicOperator && Object.keys(object).length > 1) {

//       throw new Error("If an atomic operator is used, there should only be one key in the object.");
      
//     }

//   }

//   static useFunction(): string {


//   }

//   static useVariable(): string {



//   }

//   /*
    
//     const gazeQL = new GazeQLQueryBuilder();

//     // All items named "Ford".
//     // name = ford
//     gazeQL.build({
//       name: "Ford"
//     });

//     // name = "Ford" AND assignee = authenticatedUser
//     gazeQL.build({
//       name: "Ford",
//       assignee: gazeQL.variable("authenticatedUser")
//     });

//     // (name = /Ford/i AND (assignee = authenticatedUser OR project = "Test")) OR iteration = currentIteration
//     gazeQL.build({
//       $or: [
//         {
//           $and: [
//             {
//               name: /Ford/i
//             },
//             {
//               $or: [
//                 {
//                   assignee: gazeQL.variable("authenticatedUser")
//                 },
//                 {
//                   project: "Test"
//                 }
//               ]
//             }
//           ]
//         },
//         {
//           iteration: gazeQL.variable("authenticatedUser")
//         }
//       ]
//     });

//     // not (points EXISTS)
//     gazeQL.build({
//       points: {
//         $exists: false
//       }
//     });

//     // points >= 2
//     gazeQL.build({
//       points: {
//         $greaterThanOrEquals: 2
//       }
//     });

//     // count(labels) >= 2
//     gazeQL.build({
//       [gazeQL.function("count", "labels")]: {
//         $greaterThanOrEquals: 2
//       }
//     });

//   */

// }