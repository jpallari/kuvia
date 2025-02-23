<?php
$image_filepattern = '/^.*[.](jpg|png|gif|jpeg|webp)$/i';
$rewrite_enabled = isset($_GET['dorewrite']);

function get_query_var($varname, $alternative) {
  return isset($_GET[$varname]) && !empty($_GET[$varname])
         ? $_GET[$varname]
         : $alternative;
}

function image_path() {
  $current_path = realpath(".");
  $dir_raw = get_query_var("dir", ".");
  $dir = htmlspecialchars($dir_raw);
  $dir_realpath = realpath($dir);

  if (strpos($dir_realpath, $current_path) === 0)
    return $dir;
  else
    return ".";
}

function is_image($fname) {
  global $image_filepattern;
  return preg_match($image_filepattern, $fname) === 1;
}

function format_filename($dir, $fname) {
  global $rewrite_enabled;
  if ($rewrite_enabled)
    $fpath = $fname;
  else
    $fpath = join('/', array($dir, $fname));
  echo "\"" . $fpath . "\"";
}

function print_directory_images($dir) {
  $filelist = array_filter(scandir($dir), "is_image");
  if (empty($filelist)) return;

  $init = array_slice($filelist, 0, count($filelist) - 1);
  $last = end($filelist);

  foreach($init as $fname) {
    echo format_filename($dir, $fname) . ",\n";
  }
  echo format_filename($dir, $last) . "\n";
}

echo "window.kuviaimagelist = [\n";

$dir = image_path();
if (!is_dir($dir)) die("];");

print_directory_images($dir);

echo "];";
?>
