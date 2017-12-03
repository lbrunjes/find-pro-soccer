-- create a sm accoutn for a team
CREATE OR REPLACE FUNCTION soccerapi.add_team_social_media(sm_type varchar, newaccount varchar, team_code varchar) RETURNS varchar AS $$
declare myresult varchar ;
declare mediatype int;
declare teamid int;
begin
	

	myresult :='';
	mediatype :=-1;
	teamid :=-1;
	
	select id into teamid
	from soccerapi.soccerapi.team where short_id=team_code; 
	

	select id into mediatype
	from soccerapi.soccerapi.social_media_lookup where "name"=sm_type;
	
	if teamid is null or teamid <0
	then 
		myresult := 'unknown team code';
	else
		if mediatype is null or mediatype <0
		then
			myresult := 'unsupported media type';
		else
			if exists (select 1
				from soccerapi.soccerapi.social_media_account 
				where account = newaccount and media_type = media_type)
			then
				myresult := 'account already exists';
			else
				--insert item into accounts
				insert into soccerapi.soccerapi.social_media_account (account, media_type) values(newaccount, mediatype);
				insert into soccerapi.soccerapi.team_social_media(team_id,social_media_account_id) values (teamid, (select(id) from soccerapi.soccerapi.social_media_account where account= newaccount and media_type = mediatype));
				myresult := 'okay';
			end if; 
		end if;
	end if;
	
return myresult;	
END;
    $$ LANGUAGE plpgsql;