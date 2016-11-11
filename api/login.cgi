#!/usr/bin/perl


	require "/home/dreamers/datos/indices/admin/normal.cfg";
	require "/home/dreamers/datos/indices/admin/autentificacion.pl";
	require '/home/dreamers/datos/indices/admin/cookie.lib';

use CGI qw(:standard);

use JSON; # imports encode_json, decode_json, to_json and from_json.

# my %tmp = &leer_entrada_indice("tienda/productos",584684);


$indice_principal = 'ciudadanos';


my %FORM = &parse_formx;

&GetCompressedCookies("city");
if ($Cookies{'uid'} && !$db_uid){
	my $db_uid = $Cookies{'uid'};
	$FORM{'uid'} = $db_uid; # solo porsiacaso
}

&main;
exit;

sub main{
	my ($status, $uid, %rec);
	($status, $uid, %rec) = &auth_check_password($indice_principal,'alias',$FORM{'alias'}, 'login');	     # autentifica usuario y lee usuario y lo pasa a %VAR

	$rec{'uid'} = $uid if $uid;

	my $object = {
		user => \%rec,
		status => $status,
		uid => $uid
		};

	print header('application/json');
	print objToJson($object);
}
