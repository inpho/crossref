<?php 
header('Content-Type: text/html; charset=utf-8');

include("funcs.php");
include("comp.php");

//basic parameters for HTML rendering
$disp_form = false;
$disp_sources = true;
$disp_rank = true;
$disp_query = true;

// Biographical sep_dir processing
$filename = $database_dir . 'biographical.txt';
$raw_bio = file($filename);
$sep_bio = array();
foreach ($raw_bio as $key=>$value) {
	$a = explode('::',$value);
    $sep_bio[] = $a[0];
}

/* function selected($sep_dir, $bio)
Finds the proper crossref file and returns a list of already existing crossrefs.
TODO: Create separate server-side script to return this data in JSON.
TODO: Skip for now
*/
function selected($sep_dir, $bio) {
    global $entry_dir, $database_dir, $sep_bio;
    $filename = $entry_dir . $sep_dir . '/crossref.txt';
    if (is_file($filename)) {
        $selected = file($filename);
    } else {
        $filename = $database_dir . 'related_entries.txt';
        $lines = file($filename);
        if (!$lines) die("DID NOT OPEN!!!");
        foreach ($lines as $line) {
            $line = explode('::', $line);
            if ($line[0] == $sep_dir) {
                $selected = explode('|', $line[1]);
                break;
            }   
        }
    }

    // Filter out either biographical or non-biographical references
    $filtered = array();
    foreach ($selected as $select) {
        if (!($bio xor array_search($select, $sep_bio))) {
            $filtered[] = $select;
        }
    }    
    return $filtered;
}



/* function idea($id)
Grabs the related terms and hyponyms from the API and creates the cross reference
data structure. Probably needs a bit more reworking, but is a straightforward
translation of existing code.
*/
function idea($id) {
    global $host;
    global $query;
    $occurrences = inpho("/idea/$id/occurrences.json?sep_filter=True");
    $related = inpho("/idea/$id/related.json?sep_filter=True");
    $hyponyms = inpho("/idea/$id/hyponyms.json?sep_filter=True");
    $evaluated = inpho("/idea/$id/evaluated.json?sep_filter=True");
    $first_order = inpho("/idea/$id/first_order.json?sep_filter=True");
    $c = array();
    $c = process_relation('occ', $occurrences, $c);    
    $c = process_relation('rel', $related, $c);    
    $c = process_relation('hyp', $hyponyms, $c);    
    $c = process_relation('eval', $evaluated, $c);    
    $c = process_relation('fam', $first_order, $c);    
    
    return $c;
}

function idea_thinker($id) {
    global $host;
    $occurrences = inpho("/idea/$id/thinker_occurrences.json?sep_filter=True");
    $related = inpho("/idea/$id/related_thinkers.json?sep_filter=True");
    $c = array();
    $c = process_relation('occt', $occurrences, $c);    
    $c = process_relation('relt', $related, $c);    
    return $c;
}

function thinker($id) {
    global $host;
    $occurrences = inpho("/thinker/$id/occurrences.json?sep_filter=True");
    $related = inpho("/thinker/$id/related.json?sep_filter=True");
    $hyponyms = inpho("/thinker/$id/hyponyms.json?sep_filter=True");
    $influenced = inpho("/thinker/$id/influenced.json?sep_filter=True");
    $c = array();
    $c = process_relation('occ', $occurrences, $c);    
    $c = process_relation('rel', $related, $c);    
    $c = process_relation('hyp', $hyponyms, $c);    
    $c = process_relation('inf', $influenced, $c);    

    return $c;
}

function thinker_idea($id) {
    global $host;
    $occurrences = inpho("/thinker/$id/idea_occurrences.json?sep_filter=True");
    $related = inpho("/thinker/$id/related_ideas.json?sep_filter=True");
    $c = array();
    $c = process_relation('occi', $occurrences, $c);    
    $c = process_relation('reli', $related, $c);    
    return $c;
}

/* function process_relation?
three arguments(rel_name = string, identifier for that relation (e.g. occi for occurences); API data; global array w/all the data, takes data from $data and inserts into global $c)

logic - loop processes the term, iterates through $data, indexes by label (id may be better), sep_dir = properties of that label + adds into the array $c, rel_name = stores the ranking of that dimension (e.g. if it's 3rd object, have occ of 3, null if not listed)

if statement: counts how many sources that thing has appeared in, increments num_sources by 1 
returns $c
-> is called "object operator", accesses method and property from an instantiated class

entity, one of the json objects in the array (element) entity->label is label on that particular object
'label', secondary hash that builds new array, new array that's indexed by id numbers, creating hash by id numbers inside w/ an object*/

function process_relation($rel_name, $data, $c) {
    global $host;
    $data = (array) $data; //basically arrays = hash tables in php
    // Process related terms:
    //hash table w/keys 
    for ($i = 0; $i < count($data); $i++) {
        $entity = $data[$i];
        $c[$entity->label]['label'] = $entity->label;
        $c[$entity->label]['sep_dir'] = $entity->sep_dir;
        $c[$entity->label]['url'] = $host.$entity->url;
        $c[$entity->label][$rel_name] = $i+1;

        if (!isset($c[$entity->label]['num_sources']))
            $c[$entity->label]['num_sources'] = 0;
        $c[$entity->label]['num_sources']++;
    }
    return $c; 
}

/* This function marks the already existing crossreferences and adds any that
are not present in the data sources retrieved from the InPhO API (the manually
added crossrefs) 
-> is called "object operator", accesses method and property from an instantiated class*/
function add_selected($query, $c, $bio) {
    global $host;
    $select = selected($query, $bio);
    // Process related terms:
    foreach($select as $i=>$sep_dir) {
        $entity = get_sep_idea($sep_dir);
	if ($entity) {
        $c[$entity->label]['label'] = $entity->label;
        $c[$entity->label]['sep_dir'] = $entity->sep_dir;
        $c[$entity->label]['url'] = $host.$entity->url;
        $c[$entity->label]['selected'] = true;
	}
    }
    return $c; 
}

// Looks up the InPhO entity for a given sep_dir
function get_sep_idea($sep_dir) {
    $query = "/entity.json?sep=$sep_dir";
    $results = inpho($query);

    if (count($results) > 0) {
        return $results[0];
    } else {
        return NULL;    
    }
}

// look for sep_dir query
if (isset($_POST['query'])) {
	$query = $_POST['query'];
} else if (isset($_GET['query'])) {
	$query = $_GET['query'];
} else {
    $query = "epistemology";
}
// post processing for security:
$query = html_entity_decode($query);
$query = str_replace("\\", "", $query);

$entity = get_sep_idea($query);
if (!is_null($entity)) {
    $id = $entity->ID;
    $title = $entity->label;
    $type = $entity->type;
    $sep_dir = $entity->sep_dir;
} else {
    die("Invalid sep dir!");    
}


// grab the idea and sort sources
if ($type == "idea") {
    $sources = array('occ' => array("desc" => "Occurrences", "rank"=>1),
                     'hyp' => array("desc" => "Hyponyms", "rank"=>2),
                     'eval' => array("desc" => "User Evaluations", "rank"=>3),
                     'rel' => array("desc" => "Related Terms", "rank"=>4),
                     'fam' => array("desc" => "First-order Relations", "rank"=>5)
                    );
    $ranks = idea($id);
    $ranks = add_selected($sep_dir, $ranks, false);
    usort($ranks, "ref_cmp");
    
    $bio_sources = array('occt' => array("desc" => "Occurrences", "rank"=>1),
                         'relt' => array("desc" => "Related Thinkers", "rank"=>1));
    $bio_ranks = idea_thinker($id);
    $bio_ranks = add_selected($sep_dir, $bio_ranks, true);
    usort($bio_ranks, "bio_ref_cmp");

} else if ($type == "thinker") {
    $sources = array('occi' => array("desc" => "Occurrences", "rank"=>1),
                     'reli' => array("desc" => "Related Terms", "rank"=>2));
    $ranks = thinker_idea($id);
    $ranks = add_selected($sep_dir, $ranks, false);
    usort($ranks, "ref_cmp");


    $bio_sources = array('occ' => array("desc" => "Occurrences", "rank"=>1),
                     'hyp' => array("desc" => "Hyponyms", "rank"=>2),
                     'rel' => array("desc" => "Related Thinkers", "rank"=>3),
                     'inf' => array("desc" => "Has Influenced", "rank"=>4));
    $bio_ranks = thinker($id);
    $bio_ranks = add_selected($sep_dir, $bio_ranks, true);
    usort($bio_ranks, "bio_ref_cmp");
}




//BEGIN HTML///////////////////////////
?>
<html>
<head>
    <title>SEP-InPhO Cross Reference Engine - <?php echo $title ?></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        img { border: 0px; } 
        td.source { text-align: center; }
        td {vertical-align: top;}
    </style>
</head>
<body>
<h1>Cross references for <?php echo $title ?></h1>
<p>Hostname: <?php echo $host ?></p>
<?php
if(((count($_COOKIE) > 0) && ($host == $_SERVER['HTTP_HOST'])) || (isset($_GET['user']) && ($_GET['user'] == 'InPhO'))) {
    $disp_form = true;
    $disp_query = false;
} else { 
	$disp_form = false;
	echo "You are not authenticated with the SEP; you may view but will not be able to change cross references.";
	echo "<br>";
}

if($disp_form) echo '<form action="process.php" method="POST" >';

function render_source($sources, $ref, $title) {
	global $disp_form, $disp_sources, $disp_rank;

	$num_cols = 2;
	if($disp_form) $num_cols+=1;
	if($disp_sources) $num_cols+=count($sources);
	$uncaptured_hr = false;
	$image = '<img src="check.gif">';
	$sep_image = '<img src="sep.png">';

	echo "<table>";
	echo '<tr>';
	if($disp_form) {
		echo '<th width="18"></th>';
	}
	if($disp_sources) {
		for($i=1; $i <= count($sources); $i++){
			echo '<th width="18" valign="bottom">'.$i.'</th>';
		}
	}
	echo '<th></th>';
	echo '<th>'.$title.'</th></tr>';

	foreach($ref as $label=>$array) {
		if (!$uncaptured_hr && ($array['num_sources']==0)) {
			echo '<tr><td colspan="'.$num_cols,'"><hr></td></tr>';
			$uncaptured_hr = true;
		}	

		echo "<tr>";
		if($disp_form) {
			echo '<td><input type="checkbox" name="add_ref[]" value="'.$array['sep_dir'].'"'.(($array['selected']) ? "checked" : "").'></td>';
		}
		if($disp_sources) {
            foreach($sources as $src=>$info){
				if(!isset($array[$src])) $array[$src] = false;
				echo '<td class="source">';
					if ($array[$src]) echo ($disp_rank) ? $array[$src] : $image;
				echo "</td>";
			}
		}
		echo '<td><a href="http://plato.stanford.edu/entries/'.$array['sep_dir'].'" target="_blank">'.$sep_image.'</a></td>';
		if (isset($array['selected'])) {
            echo '<td style="background-color: #cccccc;">';
        } else {
            echo '<td style="">';
        }
		echo '<a href="'.$array['url'].'" target="_blank">'.$array['label']."</a>";
		echo '</td>';
		echo"</tr>";
	}
	echo "</table>";
}



echo "<table><tr><td>";
render_source($sources, $ranks, "<span style=\"font-size: 9px;\">click SEP icon for entry<br>text link to InPhO taxonomy</span><br>Article");
echo "</td><td>";
render_source($bio_sources, $bio_ranks, "<span style=\"font-size: 9px;\">click SEP icon for entry<br>text link to InPhO taxonomy</span><br>Article");
echo "</td></tr></table>";

if ($disp_form) {
?>
<hr>
<input type="hidden" name="title" value="<?php echo $title ?>" />
<input type="hidden" name="sep_dir" value="<?php echo $sep_dir ?>" />
<input type="submit" value="Submit References" />
</form>
<?php
}


echo '<hr>';
if($disp_sources) {
	echo "<br><b>Idea Sources:</b><br>";
	foreach($sources as $key=>$s) {
		echo $s['rank']." - ".$s['desc']."<br>";	
	}

	echo "<br><b>Thinker Sources:</b><br>";
	foreach($bio_sources as $key=>$s) {
		echo $s['rank']." - ".$s['desc']."<br>";	
	}
}

echo "<hr />";

if ($disp_query) draw_query();

?>

