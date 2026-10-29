COMPOSE	= docker compose -f ./docker-compose.yml
SYSTEM	= docker system

all: up

build:
	@$(COMPOSE) build

up:
	@$(COMPOSE) up -d

kill:
	@$(COMPOSE) kill

down:
	@$(COMPOSE) down

clean:
	@$(COMPOSE) down -v

fclean: clean
	@$(SYSTEM) prune -fa 
	@ > backend/data/db.sqlite
	@find backend/public/avatars -type f \
		! -name 'avatar_1.png' \
		! -name 'avatar_2.png' \
		! -name 'avatar_3.png' \
		-delete

rebuild:
ifdef service
	@$(COMPOSE) build $(service)
	@$(COMPOSE) up -d $(service)
else
	@$(COMPOSE) build
	@$(COMPOSE) up -d
endif

re: fclean all

.PHONY: all build up down kill clean fclean re
