/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
  
