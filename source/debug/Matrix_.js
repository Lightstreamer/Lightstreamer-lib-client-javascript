import Matrix from "../../src-tool/Matrix";
  /**
   * Esegue un dump della matrice soto forma di tabella HTML
   * Se viene passata una funzione questa verr� "applicata" al valore
   * della matrice
   * @private
   */
  Matrix.prototype.dump = function(dumpFunction){
    var dumpedMatrixHtml = "";
    for (var _row in this.matrix) {
      dumpedMatrixHtml += _row + " -> ";
      for (var _field in this.matrix[_row]) {
        var dumpedVal = this.matrix[_row][_field];
        if (dumpFunction) {
          dumpedVal = dumpFunction(dumpedVal);
        }
        dumpedMatrixHtml += _field + " : " + dumpedVal + "| ";
      }
      dumpedMatrixHtml += "\n";
    }
    return dumpedMatrixHtml;
  };
  
  export default Matrix;
  
