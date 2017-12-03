select 
team.short_id as id,
account.account,
lookup.name as type

from soccerapi.soccerapi.team_social_media as tsm
inner join soccerapi.soccerapi.team as team on team.id = tsm.team_id
inner join soccerapi.soccerapi.social_media_account as account on account.id = tsm.social_media_account_id
inner join soccerapi.soccerapi.social_media_lookup as lookup on lookup.id = media_type
where account != ''
order by id, type