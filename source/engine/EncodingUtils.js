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
