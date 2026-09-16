all:
	docker compose up --build 

up:
	docker compose up --build 

down:
	docker compose  down

clean:
	docker compose  down -v --rmi all  --remove-orphans

fclean: clean
	docker system prune -af

logs:
	docker compose  logs

status:
	docker compose  ps

re: fclean all

.PHONY: all up down  clean fclean  logs status re
