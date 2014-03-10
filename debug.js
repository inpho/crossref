$(document).ready(function () {
    alert("my in jQuery document ready handler");
}) 



       //Function: inpho_get 
        //Notes: makes API call to retrieve entities that have a matching SEP entry
        //Returns: Array of results in single json entry
        //desired json return array ????
        /*
        {
            "occurrences": "",
            "hyponyms": "",
            "user evaluations": "",
            "related terms": "",
            "first-order rel": "", 
            }
        */
        var host;
        var json_array; 
        
        function inpho_get(url) {
            host = "https://inpho.cogs.indiana.edu"; 
            var json_array = [];  //empty array to store returned entities 
            
            for(var i = 0 , l = url.length; i < l; i++){
            
            $.ajax({
                type: 'GET',
                dataType: "json",
                url: host,
                data: url[i],
                success:function(jsonData){ //going to be similar to process_relation, can just use process_relation, jquery.each method (pass list of urls aka similar to map) "at the same time - nonblocking"
                  
                    for(var i = 0, l < jsonData.items.length; i < l  ; i++){
                        json_array.push(jsonData.items[i]);
                    }
                }
                
            })
            }
        }
         //Function name: get_SEPArray 
         //Notes: makes API call to retrieve all SEP entires in the InPho database
         //Returns: returns array of all entries in SEP
        
        function get_SEPArray(){
            var sep_array = [];
            
            $.each(inpho_get('/entity.json?sep_filter=True'), function(concept)) {
                if(data != "") {
                    sep_array = sep_array.concat(',', '\'', concept, sep_dir, '\'');
                }
            }
            return sep_array; 
        }
        
        /*
        function: draw_query
        */
        
       function draw_query() {
        document.write('<script language="javascript" type="text/javascript" src="actb.js" charset="UTF-8"></script>');
        document.write('<script language="javascript" type="text/javascript" src="common.js" charset="UTF-8"></script>');
        document.write('<script language="javascript">');
        document.write('window.onload = function() {');
        document.write("document.getElementById('query').setAttribute('autocomplete', 'off');");
        document.write("};");
        document.write('var aSEP = new Array('.getSEPArray().');');
        document.write('</script>');
        document.write('<form action="crossref.php" method="get">');
        document.write('SEP canonical directory: <input type="text" name="query" id="query" value="');
        if(typeof(sep_dir) != "undefined" && variable !== null){
            document.write(sep_dir);
        }
        document.write('">');
        document.write('<script>var obj = actb(document.getElementById(\'query\'),aSEP);</script>');
        document.write('<input type="submit" value="Edit references">');
        document.write('</form>');
        for ($i=0; $i<5; $i++) { document.write("<br />";)}
    }
        
        
        /*Function: idea  */
        
        function idea(id){
            idea_sources = ["/idea/$id/occurrences.json?sep_filter=True", "/idea/$id/related.json?sep_filter=True","/idea/$id/hyponyms.json?sep_filter=True", "/idea/$id/evaluated.json?sep_filter=True", "/idea/$id/first_order.json?sep_filter=True"]
            
            inpho_get(idea_sources);
        }
        
        /*Function: idea_thinker  */
        
        function idea_thinker(id){
            idea_thinker_sources = ["/idea/$id/thinker_occurrences.json?sep_filter=True", "/idea/$id/related_thinkers.json?sep_filter=True"]
            
            inpho_get(idea_thinker_sources);
        }
        
        /*Function: thinker_idea  */
        
        function thinker_idea(id){
            thinker_idea_sources = ["/thinker/$id/idea_occurrences.json?sep_filter=True", "/thinker/$id/related_ideas.json?sep_filter=True"]
            
            inpho_get(thinker_idea_sources);
        }
        
        /*Function: thinker  */
        
        function thinker(id){
            thinker_sources = ["/thinker/$id/occurrences.json?sep_filter=True", "/thinker/$id/related.json?sep_filter=True", "/thinker/$id/hyponyms.json?sep_filter=True", "/thinker/$id/influenced.json?sep_filter=True"]
            
            inpho_get(thinker_sources);
        }
        
        /*
        function: process_relation
        input: relation name (string identifier for that relation, e.g. occ for occurances); data - API data; global json_array w/ all SEP data   
        returns: json_array w/ num_sources incremented
        */
        
        function process_relation(rel_name, data, json_array){
            
            for(var i = 0; i < data.length; i++){
                entity = data[i];
                
                json_array[entity.ID]['ID'] = entity.ID;
                json_array[entity.ID]['sep_dir'] = entity.sep_dir;
                json_array[entity.ID]['url'] = entity.url;
                json_array[entity.ID][rel_name] = i + 1; 
                
                if(typeof json_array[entity.ID]['num_soruces'] != undefined) {
                    json_array[entity.ID]['num_sources'] = 0;
                }
                json_array[entity.ID]['num_sources']++; 
            }
            return json_array; 
        }
        
        /*
        function: add_selected
        input: query, json_array, bio
        */
        
        function add_selected(query, json_array, bio){
            
        }
        
        /*
        function: get_sep_idea
        returns InPho entity for a given sep_dir
        */
        function get_sep_idea(sep_dir){
            var results = [];
            var query = "/entity.json?sep=$sep_dir";
            
            results = inpho_get("/entity.json?sep=$sep_dir");
            
            if(results.length > 0){
                return results[0];
            }
            else {
                return null; 
            }
        }
       
