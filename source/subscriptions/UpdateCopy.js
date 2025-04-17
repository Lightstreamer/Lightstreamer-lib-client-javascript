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
import Constants from "../Constants";

  export default function(args,reuse) {
   
    var copiedArgs = reuse ? args : [];
    copiedArgs.changedFields = [];
    if(!reuse) {
      copiedArgs[0] = parseInt(args[0]);
      copiedArgs[1] = parseInt(args[1]);
    }
    
    for (var i = 2, l=args.length; i < l; i++) {
      if (!args[i]) {
        if (!reuse) {
          if (args[i] === "") {
            copiedArgs[i] = "";
          } else {
            copiedArgs[i] = null;
          }
        }
        
        copiedArgs.changedFields.push(i-1);
      } else if (args[i].length == -1) {
        copiedArgs[i] = Constants.UNCHANGED;
      } else {
        if (!reuse) {
          copiedArgs[i] = args[i].toString();
        }
        copiedArgs.changedFields.push(i-1);
      }
    }
    
    return copiedArgs;
    
    
  };
  
  


