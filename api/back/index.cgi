#!/usr/bin/perl

require "/home/dreamers/datos/indices/admin/normal.cfg";
use CGI qw(:standard);
use CGI::Carp qw(fatalsToBrowser);

use JSON;
use JSON::Parse 'parse_json';

eval { &main; };
if ($@) { &jserror("fatal error: $@"); }

sub main {
    print header('application/json');
    if ( $ENV{'REQUEST_METHOD'} eq 'POST' ) {    # create
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'GET' ) {    # read
        &read();
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'PUT' ) {    # update
    }
    elsif ( $ENV{'REQUEST_METHOD'} eq 'DELETE' ) {    # delete
    }
}

sub read {
    my $collection, $id, $i, indiceGenerico;
    my $contador = 0;
    my @result;
    my $resultado = "";
    my %FORM      = &parse_formx;

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

sub formatComments{
    my ( $entrada )     = @_;
    $entrada =~ s/<br>/\n/ig;
    $entrada =~ s/<p>/\n\n/ig;
    $entrada =~ s/\n/<BR>/ig; # //
    $entrada = &minidreamys( $entrada );
    return $entrada
}

sub jserror {
    my ($msg) = @_;
    my $error = { error => $msg, %ENV };
    my $json_text = to_json($error);
    print $json_text;
    exit;
}

