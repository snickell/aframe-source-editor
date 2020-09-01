/*
    return syncEval(__evalStatement, {
      context: options.context || window,
      topLevelVarRecorder: window,
      varRecorderName: 'window',
      dontTransform: deadly.ast.query.knownGlobals,
      sourceURL: options ? options.sourceURL : undefined
    });
*/
export function query_knownGlobals() {
  throw Exception("not implemented")
}