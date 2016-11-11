#!/usr/bin/perl

require "/home/dreamers/datos/indices/admin/normal.cfg";

$| = 1;

use CGI qw(:standard);
use CGI::Carp qw(fatalsToBrowser);

use JSON;
use JSON::Parse 'parse_json';

eval { &main; };
if ($@) { &jserror("fatal error: $@"); }

sub main {
    %FORM = &parse_formx;
    my $cgi = new CGI;
    print $cgi->header('application/json');

    my @ini = init();
    if ( $ENV{'REQUEST_METHOD'} eq 'POST' ) {    # create
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'GET' ) {    # read
        &read(@ini);
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'PUT' ) {    # update
        &update(@ini);
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'PATCH' ) {    # update
        &update(@ini);
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'DELETE' ) {    # delete
    }
}


sub init {
    my $collection, $id, $i, indiceGenerico;
    my $contador = 0;
    my @result;
    my $resultado = "";

    my $inputline;


    if ( $ENV{'QUERY_STRING'} ) {
        $inputline = $ENV{'QUERY_STRING'};
    }
    elsif ( $ENV{'PATH_INFO'} ) {
        $inputline = $ENV{'PATH_INFO'};
    }
    $inputline =~ s/\&.*//g;

    if ( $inputline =~ /^\/?(\w+)\/?$/ ) {    # á
        $collectionId = $1;
    }
    elsif ( $inputline =~ /^\/?(.+)\/$/ ) {
        $collectionId   = $1;
        $indiceGenerico = 1;
    }
    elsif ( $inputline =~ /^\/?(.+)\/(\d+)$/ ) {
        $collectionId = $1;
        $id           = $2;
    }

    if ( ( $collectionId eq 'jsgritos' ) or ( $collectionId eq 'admin' ) ) {
        $collectionId = 'prueba';
    }

    if ( !$collectionId ) {
        &jserror("collection missing: $collectionId - $id - $inputline");
    }

    my $indice = "gritos/" . $collectionId;
    return ( $indice, $collectionId, $id, $indiceGenerico );
}

sub read {
    my ( $indice, $collectionId, $id, $indiceGenerico ) = @_;

    if ( $FORM{'init'} ) {
        $i = $FORM{'init'} - 1;
    }
    elsif ( $collectionId && $id ) {
        $i = $id;
    }
    else {
        if ($indiceGenerico) {
            $i = &numero_entrada( $indice, "" );
        }
        else {
            $i = &numero_entrada( $collectionId, "", "/home/gritos/www/admin/logs" );
        }
    }

    #    $i++;
    while ($i) {
        my %set = &leer_entrada_indice( $i, $indice );
        if ( $set{'ref_indice'} && $set{'ref_ID'} ) {
            %set = &leer_entrada_indice( $set{'ref_ID'}, $set{'ref_indice'} );
        }
        $set{'num'} = $i;
        if ( $set{'ID'} ) {
            delete $set{'REMOTE_ADDR'};
            delete $set{'REMOTE_HOST'};
            delete $set{'uid'};
            delete $set{'clave'};
            if ( $indice =~ /\d+$/ ) {    # minigrito
                my %tmp = &leer_entrada_indice( $set{'ciudadano'}, "ciudadanos" );
                $set{'emocion'} = $tmp{'dreamy_principal'};
                $set{'name'}    = $tmp{'alias_principal'};
            }

            $set{'comments'} = &formatComments( $set{'comments'} );

            my $json_text = to_json( \%set );
            $resultado .= $json_text . ",";
            $contador++;
            if ( $contador >= 10 ) {
                last;
            }
        }
        if ($id) {
            last;
        }
        $i--;
    }
    $resultado =~ s/\,$//ig;
    if ( !$id ) {
        $resultado = "[" . $resultado . "]";
    }

    # my $json = {
    # "collection" => @result
    # "collectionId"=>$collectionId,
    # "id"=>$id,
    # "ENV"=>%ENV
    # };
    # my $json_text = to_json($json);

    print $resultado;
}

sub update {
    my ( $indice, $collectionId, $id, $indiceGenerico ) = @_;
    if ( !$collectionId or !$id ) {
        &jserror("collection or msg missing: $collectionId - $id");
    }

    my $ert = decode_json( $FORM{'PUTDATA'} );

    # $ert = $ert->{'form'};
    # $ert = decode_json($ert->{'PUTDATA'});
    my %tmp = &leer_entrada_indice( $id, $indice );
    # my %test;
    if ($tmp{'ID'}){
        foreach $key ( keys %{$ert} ) {
            if ( $ert->{$key} ne $tmp{$key} ) {
                &modificar_entrada_indice( $indice, $id, $key, $ert->{$key} );

                # $test{$key} = $ert->{$key};
            }
        }
    } else {
        &jserror("collection or msg not found: $collectionId - $id");
    }

    # &editar_entrada_indice($indice, $id, %tmp);

    # my $res;
    # foreach my $key (keys %{$ert}){
    #     $res .= $key . ": ".$ert->{$key}."; ";
    # }

    &read( $indice, $collectionId, $id, $indiceGenerico );

    # &jserror(\%test);
}


sub formatComments {
    my ($entrada) = @_;
    $entrada =~ s/<br>/\n/ig;
    $entrada =~ s/<p>/\n\n/ig;
    $entrada =~ s/\n/<BR>/ig;    # //
    $entrada = &minidreamys($entrada);
    return $entrada;
}

sub jserror {
    my ($msg) = @_;
    my $error = { error => $msg };     # , env=>\%ENV, form=>\%FORM
    my $json_text = to_json($error);

    print $json_text;
    exit;
}

sub parse_formq {
    $| = 1;
    use CGI::Simple;
    $CGI::Simple::POST_MAX = 1024 * 5000;    # esto es limite de upload subir
    our $query = CGI::Simple->new;

    my ( $name, $value, @value, %in );
    if ( ( $ENV{'QUERY_STRING'} =~ /\|/ ) && ( $ENV{'QUERY_STRING'} =~ /\;/ ) )
    { # en perl pueden hackear por las |, haciendo http://dreamers.com/indices/votar.cgi?plantilla=|echo;uname%20-a;exit|&indice=web/links&entrada=1 ejecutar?a la instruccion
        &error("Ha ocurrido un error indeterminado. |2");
    }

    foreach $name ( sort { $a <=> $b } $query->param() ) {
        next if ( $name =~ /^FICHERO_/ );
        @value = param($name);
        foreach $value (@value) {
            if ( ( $value eq "---" ) || !$value ) {
                $value = '';
                next;
            }
            if ( ( $name =~ /^New_(.*)/ ) && !( $value =~ /^\s*$/ ) ) {
                $name = $1;

                #               $value =~ s/,/$db_delim/g;
            }
            $value =~ s/<!--(.|\n)*-->//g;
            ( exists $in{$name} )
                ? ( $in{$name} .= $db_delim . $value )
                : ( $in{$name} = $value );
        }
    }
    return %in;
}
