<?php
$sources = array('hyp' => array("desc" => "Hyponyms", "rank"=>1),
                 'rel' => array("desc" => "Related Terms", "rank"=>2));
// SOURCE COMPARISON ////
function s($array, $c) {
	$sn = $c;
	if(isset($array[$sn])) 
        return -$array[$sn];
    else return 0;
}
function sum_sources($idea, $sources) {
	$sum = 0;
    foreach ($sources as $key=>$src) {
        if(isset($idea[$key]))
            $sum += -$idea[$key];
    }
	return $sum;
}
function ref_comp($a, $b, $c) {
	//Items have same number of sources - secondary sort
	if ($a['num_sources'] == $b['num_sources']) {
		$a_sum = sum_sources($a, $c);
		$b_sum = sum_sources($b, $c);
		//Items have equal averages - ternary sort
		if($a_sum == $b_sum) {
			//Loop over sources
            foreach ($c as $src=>$key) {
				//Sort if one or both sources exists
				if((s($a, $src)+s($b, $src)) != 0) {
					if((s($a, $src) == 0) || (s($b, $src) == 0)) {
						//If one is 0, the lesser moves up
						return (s($a, $src) < s($b, $src)) ? -1 : +1;
					} else {
						//If one is 0, the greater moves up
						return (s($a, $src) > s($b, $src)) ? -1 : +1;
					}
				}
                
            
            }
			for($i = 1; $i <= count($c); $i++) {
			}
			//Items have ties everywhere - revert to alphabetical
			return strcmp($a['label'], $b['label']);
		}
		//Items have different averages - move the lower-placed up.
		return ($a_sum > $b_sum) ? -1 : +1;
	}
	//Items have different number of sources - move the greater up
	return ($a['num_sources'] > $b['num_sources']) ? -1 : +1;
}
function ref_cmp($a,$b) {
	global $sources;
	return ref_comp($a, $b, $sources);
}
function bio_ref_cmp($a,$b) {
	global $bio_sources;
	return ref_comp($a, $b, $bio_sources);
}
// END SOURCE COMPARISON //
?>
