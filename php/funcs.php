<?php

// CONFIGURATION SETTINGS
if (isset($_GET['host'])) {
	$host = $_GET['host'];
}
else {
    // Default Host Parameter
    //$host = "http://inphodev.cogs.indiana.edu:8081"; // TEST
    $host = "https://inpho.cogs.indiana.edu"; // PRODUCTION
    //$host = "http://carlo.getmyip.com:5000"; // DEVELOP
    //$host = "http://localhost:5000"; // TEST
}

$web_entry_dir = '/usr/local/etc/httpd/htdocs/entries/';
$entry_dir = '/usr/local/encyclopedia/entries/';
$database_dir = '/usr/local/encyclopedia/databases/';

/*
$web_entry_dir = '/Users/inpho/SEPMirror/usr/etc/htdocs/entries/';
$entry_dir = '/Users/inpho/SEPMirror/usr/encyclopedia/entries/';
$database_dir = '/Users/inpho/SEPMirror/usr/encyclopedia/databases/';
*/


/* function inpho($url)
Makes a simple API call on the given resources. Only retrieves entities 
that have a matching SEP entry. Returns an array of PHP classes representing
the entity.
*/
/*
*/
//curl gets data from URL 

function inpho($url) {
    global $host;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$host$url");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);

    $result = curl_exec($ch);
    curl_close($ch);

    
    $obj = json_decode($result);
    if ($obj->responseStatus != 200) {
        return $obj;
    } else {
        return $obj->responseData->results;
    }
}

/* function getSEPArray()
Returns a list of all SEP entries in the InPhO database.
*/
function getSEPArray() {
	$js_array = "";
    
    foreach(inpho('/entity.json?sep_filter=True') as $concept) {
        if ($js_array!="") $js_array .= ',';
        $js_array .= '\''.$concept->sep_dir.'\'';
    }
    
    return $js_array;
}

function draw_query() {
	echo '<script language="javascript" type="text/javascript" src="actb.js" charset="UTF-8"></script>';
	echo '<script language="javascript" type="text/javascript" src="common.js" charset="UTF-8"></script>';
	echo '<script language="javascript">';
	echo 'window.onload = function() {';
	echo "document.getElementById('query').setAttribute('autocomplete', 'off');";
	echo "};";
	echo 'var aSEP = new Array('.getSEPArray().');';
	echo '</script>';

	echo '<form action="crossref.php" method="get">';
	echo 'SEP canonical directory: <input type="text" name="query" id="query" value="';
	if(isset($sep_dir)) echo $sep_dir;
	echo '">';
	echo '<script>var obj = actb(document.getElementById(\'query\'),aSEP);</script>';
	echo '<input type="submit" value="Edit references">';
	echo '</form>';
    for ($i=0; $i<5; $i++) { echo "<br />"; }
}
?>
