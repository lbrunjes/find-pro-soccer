

select 
team.name,
team.short_id as id,
team.website,
team.crest_url as crest,
team.color1,
team.color2,
team.color3,
league.short_id as league,
stadium.name as stadium,
stadium.address1,
stadium.address2,
stadium.latitude,
stadium.longitude

from soccerapi.soccerapi.team as team
inner join soccerapi.soccerapi.league as league on league.id = team.league_id
inner join soccerapi.soccerapi.stadium as stadium on stadium.id = team.home_stadium_id


order by league, team.name