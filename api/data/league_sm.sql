select 
league.short_id as id,
account.account,
lookup.name as type

from soccerapi.soccerapi.league_social_media as lsm
inner join soccerapi.soccerapi.league as league on league.id = lsm.league_id
inner join soccerapi.soccerapi.social_media_account as account on account.id = lsm.social_media_account_id
inner join soccerapi.soccerapi.social_media_lookup as lookup on lookup.id = media_type
where account != ''
order by id, type