#!/usr/bin/perl

require "/home/dreamers/datos/indices/admin/normal.cfg";
use CGI qw(:standard);

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
    my $Name;
    my %FORM = &parse_formx;
    if ( $ENV{'QUERY_STRING'} =~ /^\/?(\w+)\/?/ ) {
        $Name = $1;
    } elsif ($ENV{'PATH_INFO'} =~ /^\/?(\w+)\/?/ ){
        $Name = $1;
    }

    if ( !$Name ) {
        &jserror("missing Name $Name");
    }

    my %subarray = &subarray( "gritosdb", "Name" );
    my $entry = $subarray{$Name};
    my %set = &leer_entrada_indice($entry, "gritosdb");

    my $json_text = to_json( \%set );

    print $json_text;
}

sub jserror {
    my ($msg) = @_;
    my $error = { error => $msg, %ENV };
    my $json_text = to_json($error);
    print $json_text;
}
