#!/usr/bin/perl


	require "/home/dreamers/datos/indices/admin/normal.cfg";
use CGI qw(:standard);

use JSON; # imports encode_json, decode_json, to_json and from_json.

# my %tmp = &leer_entrada_indice("tienda/productos",584684);


$indice = 'ciudadanos';


my %FORM = &parse_formx;
print header('application/json');

&main;
exit;

sub login{
	my (%rec);
	unless (($ENV{'HTTP_REFERER'} =~ /localhost/ig) || ($ENV{'HTTP_REFERER'} =~ /^http\:\/\/[\w\d]*\.?dreamers\.com/ig) || ($ENV{'HTTP_REFERER'} =~ /^http\:\/\/[\w\d]*\.?gritos\.com/ig) || ($ENV{'HTTP_REFERER'} =~ /^http\:\/\/[\w\d]*\.?dreamerscity\.com/ig)){
		return("bad request");
	}
	if ($FORM{'access_token'}){
		my $fb_response = fb_request($FORM{'access_token'});
		$fb_response = decode_json($fb_response);
		my $FBuserID = $fb_response->{'data'}->{'user_id'};
		if ($FBuserID ne $FORM{'FBuserID'}){
			return "fb user not authenticated";
		}
	} else {
		return "FB authentication required";
	}

	my ($numero_entrada, @alias_que_coinciden) = &buscar_subindice($indice, 'email', $FORM{'email'}, 1, $DIR_indices);
	if (($numero_entrada =~ /^(\d+)$/) && ($numero_entrada > 0)){
		%rec = &leer_entrada_indice($numero_entrada,$indice,$DIR_indices);
		unless ($rec{'ID'}){
			return("Usuario no valido/erroneo ($numero_entrada)");
		}
	}
	else{
		# usuario no encontrado. me lo invento.
		if ($FORM{'FBuser'}){


		} else {
			return("Usuario no encontrado ($numero_entrada)");
		}
	}
	srand( time() ^ ($$ + ($$ << 15)) );
	my $anexo = "X";

	my $db_uid = $anexo . $rec{'NUMERO_ENTRADA'} . 'x' . (int(rand(1000000)) + 1);
	open(AUTH, ">$auth_dir/$db_uid") or &cgierr("no se pudo abrir fichero de auth: $auth_dir/$uid. Razon: $!\n");
	print AUTH "$rec{'NUMERO_ENTRADA'}: $ENV{'REMOTE_ADDR'}\n";
	close AUTH;
	return ('ok', $db_uid, %rec);
}

sub fb_request{
	my ($access_token) = @_;

	use LWP;
	my $ua = LWP::UserAgent->new(timeout => 60);
	$ua->agent("Mozilla/4.0 (compatible; MSIE 5.5; Windows 98)");

	# Gritos.com Facebook APP
	my $app_secret = "b9165f711355f2b57669bf35fb980223";
	my $app_id = "472185159492660";
	my $url = "https://graph.facebook.com/debug_token?input_token=$access_token&access_token=$app_id|$app_secret";
	my $request = HTTP::Request->new( GET => $url );
	my $response = $ua->request( $request );

	unless ($response->is_success){
		return 0;
	} else {
		$content = $response->content;
		return $content;
	}
}

sub main{
	my ($status, $uid, %rec);
	($status, $uid, %rec) =	&login;
	$rec{'uid'} = $uid if $uid;
	# my @testarray;
	# push(@testarray, \%rec);
	my $object = {
		user => \%rec,
		status => $status,
		uid => $uid
		};
	$rec{'status'} = $status;
	my $json = \%rec;
	my $json_text = to_json($json);
	# print $json_text;
	print objToJson($object);
}


sub registro_rapido{
	my $fb_user = decode_json($FORM{'FBuser'});
	my %rec;
	$rec{'FB_id'} = $fb_user->{'id'};
	$rec{'FB_name'} = $fb_user->{'name'};
	$rec{'FB_firstname'} = $fb_user->{'first_name'};
	$rec{'FB_username'} = $fb_user->{'username'};
	$rec{'FB_gender'} = $fb_user->{'gender'};
	$rec{'FB_quotes'} = $fb_user->{'quotes'};
	$rec{'FB_birthday'} = $fb_user->{'birthday'}; # va separado por /
####################################### aqui me he quedao

	$FORM{'alias'} = &Webify($FORM{'alias'});
	$FORM{'alias'} =~ s/<([^>]|\n)*>//g;
	$FORM{'alias'} =~ s/\s+/ /g;
	$FORM{'alias'} =~ s/^\s//g;
	$FORM{'alias'} =~ s/\s$//g;

	if(&buscar_subindice($indice_principal,'nombre_apellidos',$FORM{'nombre_apellidos'})){
		&error_local($textos{'5'});
		&mostrar_basico;
		return;
	}
	elsif(&buscar_subindice($indice_principal,'email',$FORM{'email'})){
		&error_local($textos{'6'}) unless ($FORM{'email'} eq 'tienda@dreamers.com');
	}

	elsif($FORM{'password'} ne $FORM{'confpasswd'}){
		&error_local($textos{'7'});
	}
	elsif (length($FORM{'password'}) < 4){
		&error_local($textos{'8'});
	}
	elsif(!&email_check($FORM{'email'})){
		&error_local($textos{'9'});
	}


	$FORM{'fecha_nacimiento'} = "$FORM{'fecha_nacimiento_dia'}-$FORM{'fecha_nacimiento_mes'}-$FORM{'fecha_nacimiento_ano'}";
	if(&comprobar_formato_fecha($FORM{'fecha_nacimiento'})){
		&error_local($textos{'12'});
	}

	# comprobar que los alias no están ya registrados
	($string,@aliases) = &buscar_subindice($indice_principal,'alias',$FORM{'alias'},1);
	if ($string){
		$CONFIG{'ERROR'} = "$textos{'13'}: ";
		$CONFIG{'ERROR'} .= join(",", @aliases);
		$CONFIG{'ERROR'} .= "$textos{'14'}";
		&error_local($CONFIG{'ERROR'});
	}

	# comprobar que los alias no incluyen caracteres raros
	@aliases = split (/\Q$db_delim\E/, $FORM{'alias'});
	unless ((@aliases)){
			&error_local("ERROR<br>$textos{'15'}");
	}
	foreach $alias (@aliases){
		$aliastmp = &limpia($alias);
		if (!(grep $_ =~ /^\Q$aliastmp\E$/ig, @aliasestmp)){
			push (@aliasestmp, $aliastmp);
		}
		else{
			&error_local("ERROR<br>$textos{'16'}");
		}

		if ($alias =~ /[^\w\d\_\-\+\.\á\é\í\ó\ú\ñ\Ñ\Á\É\Í\Ó\Ú\s\@]/ig){
			&error_local("ERROR<br>$textos{'17'}: $alias $textos{'18'}.");
		}
		elsif (length($alias) < 3){
			&error_local("ERROR<br>$textos{'17'}: $alias $textos{'19'}.");
		}
		elsif (length($alias) > 25){
			&error_local("ERROR<br>$textos{'17'}: $alias $textos{'20'}.");
		}
	}

	# encriptar la clave
	$FORM{'password'} = encriptar($FORM{'password'});
	undef($FORM{'confpasswd'});
	undef($FORM{'registro'});
	undef($FORM{'REQUIRED'});
	undef($FORM{'Submit'});

	$FORM{'fecha_registro'} = &format_date(time, "<0d>-<0m>-<year>");

	%subarrayseccion = &subarray("web/categorias","Name",1); # da un array con %rec{ID} = Name
	%subarraywebs = &subarray("web/links","Title",1);

	$Num_Entries = &numero_entrada($indice_principal,1);	# Pillar numero de entrada

	srand(time);
	$FORM{'congelado'} = rand(time);
	$FORM{'congelado'} = int($FORM{'congelado'});
	$codigo_confirmacion = &Encrypt($FORM{'congelado'},$encryptkey,asdfhzxcvnmpoiyk);

	$cuerpo = "$textos{'21'} @aliases[0]!!\n\n";
	$cuerpo .= "$textos{'22'}";
	$cuerpo .= "$textos{'23'} $FORM{'fecha_registro'}.\n";
	$cuerpo .= "$textos{'24'}.\n";
	$cuerpo .= "$textos{'25'}:\n";
	$cuerpo .= "$CONFIG{'CGI_URL'}?ID=$Num_Entries&confirmacion=$codigo_confirmacion\n\n";
	$cuerpo .= "$textos{'26'}: ".$Num_Entries."\n\n";
	$cuerpo .= "$textos{'27'}:\n";
	$cuerpo .= "$textos{'28'}: ".@aliases[0]."\n";
	$cuerpo .= "$textos{'29'} 1: ".@aliases[1]."\n" if (@aliases[1]);
	$cuerpo .= "$textos{'29'} 2: ".@aliases[2]."\n" if (@aliases[2]);
	$cuerpo .= "$textos{'29'} 3: ".@aliases[3]."\n" if (@aliases[3]);
	$cuerpo .= "$textos{'29'} 4: ".@aliases[4]."\n" if (@aliases[4]);
	$cuerpo .= "$textos{'30'}: ".$FORM{'nombre_apellidos'}."\n";
	$cuerpo .= "$textos{'31'}: ".$FORM{'direccion'}."\n";
	$cuerpo .= "$textos{'32'}: ".$FORM{'ciudad'}."\n";
	$cuerpo .= "$textos{'33'}: ".$FORM{'codigo_postal'}."\n";
	$cuerpo .= "$textos{'34'}: ".$FORM{'provincia'}."\n";
	$cuerpo .= "$textos{'35'}: ".$FORM{'pais'}."\n";
	$cuerpo .= "$textos{'36'}: ".$FORM{'telefono'}."\n";
	$cuerpo .= "$textos{'37'}: ".$FORM{'email'}."\n";
	$cuerpo .= "$textos{'38'}: ".$FORM{'fecha_nacimiento'}."\n";
	$cuerpo .= "$textos{'39'}: ".$subarrayseccion{$FORM{'seccion_preferida'}}."\n" if($FORM{'seccion_preferida'});
	$cuerpo .= "$textos{'40'}: ".$subarraywebs{$FORM{'web_preferida'}}."\n\n" if ($FORM{'web_preferida'});
	$cuerpo .= "$textos{'41'}\n\n";
	$cuerpo .= "$textos{'42'}.\n\n";
	$cuerpo .= "$textos{'43'}\n";
	$cuerpo .= "webmaster\@dreamers.com\n";
	$cuerpo .= "http://dreamers.com";

	($error, @basurilla) = &send_email("$textos{'44'} $Num_Entries !", "webmaster\@dreamers.com", $FORM{'email'}, $cc, "nacho\@dreamers.com", $cuerpo);
	if ($error){
		foreach $basurilla(@basurilla){
			$basurilla2 .= "$basurilla, ";
		}
		&error_local("ERROR<br>$textos{'2'}:<br> $error<br>$basurilla2<br>$textos{'45'}");
	}
	$FORM{'ID'} = $Num_Entries;
	&escribir_entrada_indice($indice_principal,$Num_Entries,%FORM);
	&increment_entrada($indice_principal);	# subir uno el contador
}
