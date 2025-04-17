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
/**
 * @since January 2018
 */

    
    /**
     * Converts a string containing sequences as {@code %<hex digit><hex digit>} into a new string 
     * where such sequences are transformed in UTF-8 encoded characters. <br> 
     * For example the string "a%C3%A8" is converted to "aè" because the sequence 'C3 A8' is 
     * the UTF-8 encoding of the character 'è'.
     */
    export default {unquote: decodeURIComponent};
